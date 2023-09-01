const express = require('express');
const router = express.Router();

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { generateSecret, verify } = require('2fa-util');
const { filter, formatUser } = require('../utils/utils');
const { nameInUse } = require('../utils/display');
const BBCodeManager = require('../utils/bbcode-manager');

const constants = require('../utils/constants');

const ObjectId = require('mongoose').Types.ObjectId;

const User = require('../models/User');
const DisplayName = require('../models/account/DisplayName');
const Session = require('../models/Session');
const Post = require('../models/forums/Post');
const Thread = require('../models/forums/Thread');
const Usergroup = require('../models/forums/Usergroup');
const UserActivity = require('../models/forums/UserActivity');
const VisitorMessage = require('../models/VisitorMessage');
const MiscData = require('../models/MiscData');

const { formatNameForProtocol, formatPlayerNameForDisplay } = require('../utils/utils');
const { validateUsername, validatePassword, validate, validateEmail, validateRecaptcha, validateDiscord } = require('../utils/validate');

const validateOptions = {
    displayName: {
        type: 'string',
        name: 'Display Name',
        min: 3,
        max: 12,
        regex: /^[a-zA-Z0-9_ ]+$/,
    },
    email: validateEmail,
    discord: validateDiscord,
    displayGroup: {
        type: 'string',
        name: 'Display Group',
        regex: /^[a-f\d]{24}$/i,
    },
    usergroups: {
        type: ['string'],
        name: 'Usergroups',
        regex: /^[a-f\d]{24}$/i,
    },
};

const validateForCreate = {
    username: validateUsername,
    ...validateOptions,
    password: validatePassword
};

const validateForEdit = {
    username: {
        ...validateUsername,
        required: false,
    },
    ...validateOptions,
    password: {
        ...validatePassword,
        required: false,
    }
};

router.post('/', async(req, res) => {
    let username = req.body.username;
    let displayName = req.body.displayName;
    let password = req.body.password;
    let email = req.body.email;
    let discord = req.body.discord;
    let displayGroup = req.body.displayGroup;
    let usergroups = req.body.usergroups;
    let token = req.body.token;
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    let admin = req.body.admin;

    if (admin && (!res.user || res.user.displayGroup.rights < 2)) {
        res.status(403).send({ error: 'Insuficient permissions.' });
        return;
    }

    username = username.toLowerCase().replace(" ", "_");

    if (!admin) {
        let recaptchaError = await validateRecaptcha(token);
        if (recaptchaError) {
            res.status(400).json({ error: recaptchaError });
            return;
        }
    }

    let error = validate(validateForCreate, { username, displayName, password, email, discord, displayGroup, usergroups });
    if (error) {
        res.status(400).json({ error });
        return;
    }

    try {

        let user = await User.findOne({ username });
        if (user) {
            res.status(400).send({ error: 'Username already exists.' });
            return;
        }

        if (displayGroup && admin) {
            displayGroup = await Usergroup.findById(displayGroup);
            if (!displayGroup) {
                res.status(400).send({ error: 'Invalid display group.' });
                return;
            }
        } else
            displayGroup = constants['REGULAR_USERGROUP'];

        //TODO - find better way to ensure player has the regular_usergroup either in display group or usergroups
        if (usergroups && admin) {
            if (!usergroups.includes(constants['REGULAR_USERGROUP']) && displayGroup != constants['REGULAR_USERGROUP'])
                usergroups.push(constants['REGULAR_USERGROUP']);
            for (let i = 0; i < usergroups.length; i++) {
                if (!ObjectId.isValid(usergroups[i])) {
                    res.status(400).send({ error: 'Invalid usergroup ID.' });
                    return;
                }
                let group = await Usergroup.findById(usergroups[i]);
                if (!group) {
                    res.status(400).send({ error: 'Invalid usergroup: ' + usergroups[i] });
                    return;
                }
                usergroups[i] = group;
            }
        }

        displayName = (displayName && admin) ? formatPlayerNameForDisplay(displayName) : formatPlayerNameForDisplay(username);
        if (await nameInUse(displayName) || await nameInUse(formatPlayerNameForDisplay(username))) {
            res.status(400).send({ error: 'Name already in use.' });
            return;
        }

        let hash = await bcrypt.hash(password, 10);
        let sessionId = uuidv4();

        let display = new DisplayName({
            name: displayName,
        });

        await display.save();

        user = new User({
            username,
            email,
            discord,
            display,
            hash,
            displayGroup,
            usergroups,
            creationIp: ip
        });

        await user.save();

        if (!admin) {
            let session = new Session({
                user,
                sessionId,
                expires: Date.now() + 1000 * 60 * 30,
            });

            await session.save();
        } else
            user = await formatUser(user);

        res.status(201).json({ success: true, sessionId, user });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Error creating user.' });
    }
});

router.put('/:id', async(req, res) => {
    if (!res.loggedIn || res.user.displayGroup.rights < 2) {
        res.status(403).send({ error: 'Insuficient permissions.' });
        return;
    }

    let id = req.params.id;
    if (!ObjectId.isValid(id)) {
        res.status(400).send({ error: 'Invalid ID.' });
        return;
    }


    let displayName = req.body.displayName;
    let email = req.body.email;
    let discord = req.body.discord;
    let displayGroup = req.body.displayGroup;
    let usergroups = req.body.usergroups;
    let password = req.body.password;

    let error = validate(validateForEdit, { displayName, email, discord, displayGroup, usergroups, password });
    if (error) {
        res.status(400).send({ error });
        return;
    }

    try {

        let user = await User.findById(id);
        if (!user) {
            res.status(400).send({ error: 'User not found.' });
            return;
        }

        if (!ObjectId.isValid(displayGroup)) {
            res.status(400).send({ error: 'Invalid display group ID.' });
            return;
        }

        displayGroup = await Usergroup.findById(displayGroup);
        if (!displayGroup) {
            res.status(400).send({ error: 'Invalid display group.' });
            return;
        }

        if (!usergroups)
            usergroups = [];

        if (displayGroup._id !== constants['REGULAR_USERGROUP'] && !usergroups.includes(constants['REGULAR_USERGROUP']))
            usergroups.push(constants['REGULAR_USERGROUP']);

        for (let i = 0; i < usergroups.length; i++) {
            if (!ObjectId.isValid(usergroups[i])) {
                res.status(400).send({ error: 'Invalid usergroup ID.' });
                return;
            }
            let group = await Usergroup.findById(usergroups[i]);
            if (!group) {
                res.status(400).send({ error: 'Invalid usergroup.' });
                return;
            }
            usergroups[i] = group;
        }

        displayName = formatPlayerNameForDisplay(displayName);

        if (await nameInUse(displayName)) {
            res.status(400).send({ error: 'Display name already in use.' });
            return;
        }

        if (password) {
            let hash = await bcrypt.hash(password, 10);
            user.hash = hash;
        }

        let display = await DisplayName.findById(user.display._id);
        display.name = displayName;

        await display.save();

        user.email = email;
        user.discord = discord;
        user.displayGroup = displayGroup;
        user.usergroups = usergroups;

        await user.save();

        user = await formatUser(user);

        res.status(200).json({ user });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error updating user.' });
    }
});

router.delete('/:id', async(req, res) => {
    if (!res.loggedIn || res.user.displayGroup.rights < 2) {
        res.status(403).send({ error: 'Insufficient permissions.' });
        return;
    }

    let id = req.params.id;
    if (!ObjectId.isValid(id)) {
        res.status(400).send({ error: 'Invalid ID.' });
        return;
    }

    try {

        //delete their display name
        let user = await User.findById(id);
        if (!user) {
            res.status(400).send({ error: 'User not found.' });
            return;
        }

        await DisplayName.findByIdAndDelete(user.display._id);

        await user.delete();

        res.status(200).json();

    } catch (err) {
        console.error(err);
        res.status(500).send({ error });
    }
});

router.get('/admin/:page', async(req, res) => {
    if (!res.loggedIn || res.user.displayGroup.rights < 2) {
        res.status(403).send({ error: 'Insufficient permissions.' });
        return;
    }

    let page = Number(req.params.id) || 1;

    try {

        let users = await User.find({})
            .sort({ username: 1 })
            .skip((page - 1) * 10)
            .limit(10);

        users = await Promise.all(users.map(async(user) => await formatUser(user)));

        let pageTotal = Math.ceil(await User.countDocuments() / 10);

        res.status(200).send({ users, pageTotal });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error });
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

router.post('/revoke/:id', async(req, res) => {
    if (!res.loggedIn || res.user.displayGroup.rights < 2) {
        res.status(403).send({ error: 'Insufficient permissions.' });
        return;
    }

    let id = req.params.id;
    if (!ObjectId.isValid(id)) {
        res.status(400).send({ error: 'Invalid ID.' });
        return;
    }

    try {

        let user = await User.findById(id);
        if (!user) {
            res.status(400).send({ error: 'User not found.' });
            return;
        }

        await Session.deleteMany({ user: user._id });

        res.status(200).send();

    } catch (error) {
        console.error(error);
        res.status(500).send({ error });
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

        user = await formatUser(user, true);

        res.status(200).json({ user });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error getting user.' });
    }
});

router.get('/:id/about', async(req, res) => {
    let id = req.params.id;

    try {

        let user = await User.findById(id);
        if (!user) {
            res.status(404).send({ error: 'User not found.' });
            return;
        }

        let manager = new BBCodeManager(user.settings.about);

        let formatted = await manager.getFormattedText(res.user);

        res.status(200).json({ about: formatted });

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

        if (!user.settings.allowVisitorMessages) {
            res.status(403).send({ error: 'User does not allow visitor messages.' });
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
        res.status(401).send({ error: 'You must be logged in to leave a visitor message' });
        return;
    }

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

        if (!user.settings.allowVisitorMessages) {
            res.status(403).send({ error: 'User does not allow visitor messages.' });
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