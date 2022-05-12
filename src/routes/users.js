const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { generateSecret, verify } = require('2fa-util');
const { filter } = require('../utils/utils');

const constants = require('../utils/constants');

const ObjectId = require('mongoose').Types.ObjectId;

const User = require('../models/User');
const Session = require('../models/Session');
const Post = require('../models/forums/Post');
const Thread = require('../models/forums/Thread');
const Usergroup = require('../models/forums/Usergroup');
const UserActivity = require('../models/forums/UserActivity');
const VisitorMessage = require('../models/VisitorMessage');
const MiscData = require('../models/MiscData');
const router = express.Router();

const { formatNameForProtocol, formatPlayerNameForDisplay } = require('../utils/utils');
const { validateUsername, validatePassword, validate, validateEmail, validateRecaptcha } = require('../utils/validate');

router.post('/', async(req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let email = req.body.email;
    let displayGroup = req.body.displayGroup;
    let usergroups = req.body.usergroups;
    let token = req.body.token;
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    username = username.toLowerCase().replace(" ", "_");

    let recaptchaError = await validateRecaptcha(token);
    if (recaptchaError) {
        res.status(400).json({ error: recaptchaError });
        return;
    }

    let validateOptions = {
        username: validateUsername,
        password: validatePassword,
        email: validateEmail
    };

    let [validated, error] = validate(validateOptions, { username, password, email });
    if (!validated) {
        res.status(400).json({ error });
        return;
    }

    try {

        let user = await User.findOne({ username });
        if (user) {
            res.status(400).send({ error: 'Username already exists.' });
            return;
        }

        if (displayGroup) {
            displayGroup = await Usergroup.findOne({ _id: displayGroup });
            if (!displayGroup) {
                res.status(400).send({ error: 'Invalid display group.' });
                return;
            }
        } else
            displayGroup = constants['REGULAR_USERGROUP'];

        if (usergroups) {
            if (!usergroups.includes(constants['REGULAR_USERGROUP']) && displayGroup != constants['REGULAR_USERGROUP'])
                usergroups.push(constants['REGULAR_USERGROUP']);
            for (let i = 0; i < usergroups.length; i++) {
                let group = await Usergroup.findOne({ _id: usergroups[i] });
                if (!group) {
                    res.status(400).send({ error: 'Invalid usergroup.' });
                    return;
                }
                usergroups[i] = group;
            }
        }


        let displayName = formatPlayerNameForDisplay(username);
        let hash = await bcrypt.hash(password, 10);
        let sessionId = uuidv4();

        user = new User({
            username,
            email,
            displayName,
            hash,
            displayGroup,
            usergroups,
            creationIp: ip
        });

        await user.save();

        let session = new Session({
            user,
            sessionId,
            expires: Date.now() + 1000 * 60 * 30,
        });

        await session.save();

        res.status(201).json({ success: true, sessionId, user });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Error creating user.' });
    }
});

router.delete('/:id', async(req, res) => {
    if (!res.loggedIn || res.user.displayGroup.rights < 2) {
        res.status(403).send({ error: 'Insufficient permissions.' });
        return;
    }
    let id = req.params.id;
    let user = User.findOne({ username: id });
    if (!user)
        user = User.findById(id);
    if (!user) {
        res.status(404).send({ error: 'User not found.' });
        return;
    }
    try {
        await user.deleteOne();
        res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Error deleting user.' });
    }
});

router.get('/auth', async(req, res) => {
    if (!res.loggedIn)
        res.status(200).json({ result: false });
    else
        res.status(200).json({ result: res.loggedIn, user: res.user });
});

router.post('/logout', async(req, res) => {
    if (!res.loggedIn) {
        console.error('not logged in');
        res.status(401).send({ error: 'Not logged in.' });
        return;
    }
    try {

        let session = await Session.findOne({ sessionId: res.sessionId });
        if (session) await session.deleteOne();

        res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Error logging out.' });
    }
});

router.post('/auth', async(req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let remember = req.body.remember;
    let otp = req.body.otp;

    username = formatNameForProtocol(username);
    try {

        let user = await User.findOne({ username });
        if (!user) {
            res.status(401).send({ error: 'Invalid username or password.' });
            return;
        }
        if (user.tfaKey) {
            if (!otp) {
                res.status(401).send({ error: 'Two-factor authentication is enabled. Please enter your OTP.' });
                return;
            }
            let secret = user.tfaKey;
            let verified = verify(secret, otp);
            if (!verified) {
                res.status(401).send({ error: 'Invalid OTP.' });
                return;
            }
        }

        let valid = await bcrypt.compare(password, user.hash);
        if (!valid) {
            res.status(401).send({ error: 'Invalid username or password.' });
            return;
        }
        let sessionId = uuidv4();

        let expires = Date.now();
        if (remember)
            expires += (1000 * 60 * 60 * 24 * 60);
        else
            expires += (1000 * 60 * 60 * 24);

        let session = new Session({
            user,
            sessionId,
            expires
        });

        await session.save();

        await user.save();

        res.status(200).send({
            sessionId,
            user
        });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Error logging in.' });
    }
});

router.post('/activity', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ error: 'Not logged in.' });
        return;
    }
    let activity = req.body.activity;
    let type = req.body.type;
    let id = req.body.id;
    if (!activity) {
        res.status(400).send({ error: 'Missing activity.' });
        return;
    }
    let userActivity = await UserActivity.findOne({ 'user': res.user._id });
    if (!userActivity) {
        userActivity = new UserActivity({
            user: res.user,
            activity: activity,
            type,
            activityId: id
        });
    } else {
        userActivity.activity = activity;
        userActivity.type = type;
        userActivity.activityId = id;
        userActivity.updatedAt = new Date();
    }
    try {
        await userActivity.save();
        res.status(200).json({ activity: userActivity });

        let totalOnline = await UserActivity.countDocuments({
            updatedAt: {
                $gt: new Date(Date.now() - (5 * 60 * 1000))
            }
        });
        let mostOnline = await MiscData.findOne({ name: 'mostOnline' });
        if (!mostOnline) {
            mostOnline = new MiscData({
                name: 'mostOnline',
                value: totalOnline
            });
            await mostOnline.save();
        }
        if (totalOnline > mostOnline.value) {
            mostOnline.value = totalOnline;
            await mostOnline.save();
        }
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Error saving user activity.' });
    }
});

router.get('/:id', async(req, res) => {
    let id = req.params.id;

    try {
        let user = await User.findById(id);
        if (!user) {
            res.status(404).send({ error: 'User not found.' });
            return;
        }

        user = {
            ...user._doc,
            postCount: await user.getPostCount(),
            threadsCreated: await user.getThreadsCreated(),
            thanksReceived: await user.getThanksReceived(),
            thanksGiven: await user.getThanksGiven(),
            totalLevel: await user.getTotalLevel(),
        };

        res.status(200).json({ user });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error getting user.' });
    }
});

router.get('/:id/threads/:page', async(req, res) => {

    let id = req.params.id;
    let page = req.params.page;

    if (!ObjectId.isValid(id)) {
        res.status(400).send({ error: 'Invalid user id.' });
        return;
    }

    try {

        let user = await User.findById(id);
        if (!user) {
            res.status(404).send({ error: 'User not found.' });
            return;
        }

        let threads = await Thread.find({ author: user })
            .sort({ createdAt: -1 });

        threads = await filter(threads, async(thread) => {
            thread = await thread.fill('postCount');
            return thread.subforum.permissions.checkCanSee(res.user, thread);
        });

        let pageTotal = Math.ceil(threads.length / 10);

        if (page > pageTotal)
            page = pageTotal;

        let start = (page - 1) * 10;
        let end = start + 10;

        threads = threads.slice(start, end);

        res.status(200).json({ threads, pageTotal });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error getting user.' });
    }
});

router.get('/:id/posts/:page', async(req, res) => {

    let id = req.params.id;
    let page = req.params.page;

    if (!ObjectId.isValid(id)) {
        res.status(400).send({ error: 'Invalid user id.' });
        return;
    }

    try {

        let user = await User.findById(id);
        if (!user) {
            res.status(404).send({ error: 'User not found.' });
            return;
        }

        let posts = await Post.find({ author: user })
            .sort({ createdAt: -1 });

        posts = await filter(posts, async(post) => {
            if (!post.thread) {
                console.error('No thread for post: ' + post);
                return false;
            }
            post.thread = await post.thread.fill('postCount');
            return post.thread.subforum.permissions.checkCanSee(res.user, post.thread);
        });

        let pageTotal = Math.ceil(posts.length / 10);

        if (page > pageTotal)
            page = pageTotal;

        let start = (page - 1) * 10;
        let end = start + 10;

        posts = posts.slice(start, end);

        res.status(200).json({ posts, pageTotal });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error getting user.' });
    }
});

router.get('/:id/messages/:page', async(req, res) => {

    let id = req.params.id;
    let page = req.params.page;

    if (!ObjectId.isValid(id)) {
        res.status(400).send({ error: 'Invalid user id.' });
        return;
    }

    try {

        let user = await User.findById(id);
        if (!user) {
            res.status(404).send({ error: 'User not found.' });
            return;
        }

        let messages = await VisitorMessage.find({ user })
            .sort({ createdAt: -1 })
            .skip((page - 1) * 5)
            .limit(5);

        let pageTotal = Math.ceil(await VisitorMessage.countDocuments({ user }) / 5);

        res.status(200).json({ messages, pageTotal });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error getting user.' });
    }
});

router.post('/:id/messages', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ error: 'Not logged in.' });
        return;
    }
    //TODO - ability to disable visitors section

    let id = req.params.id;

    if (!ObjectId.isValid(id)) {
        res.status(400).send({ error: 'Invalid user id.' });
        return;
    }

    let message = req.body.message;
    if (message.length < 5 || message.length > 200) {
        res.status(400).send({ error: 'Message must be between 5 and 200 characters.' });
        return;
    }

    try {
        let user = await User.findById(id);
        if (!user) {
            res.status(404).send({ error: 'User not found.' });
            return;
        }

        let visitorMessage = new VisitorMessage({
            user,
            author: res.user,
            content: message
        });

        let saved = await visitorMessage.save();

        res.status(200).json({ message: saved });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error sending message.' });
    }

});

router.delete('/messages/:id', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ error: 'Not logged in.' });
        return;
    }

    let id = req.params.id;
    if (!ObjectId.isValid(id)) {
        res.status(400).send({ error: 'Invalid message id.' });
        return;
    }

    try {

        let message = await VisitorMessage.findById(id);
        if (!message) {
            res.status(404).send({ error: 'Message not found.' });
            return;
        }

        if (!message.author._id.equals(res.user._id) && !message.user._id.equals(res.user._id)) {
            res.status(403).send({ error: 'You do not have permission to delete this message.' });
            return;
        }

        await message.remove();

        res.status(200).send({ message: 'Message deleted.' });


    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error deleting message.' });
    }
});

module.exports = router;