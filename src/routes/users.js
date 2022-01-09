const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { generateSecret, verify } = require('2fa-util');

const User = require('../models/User');
const Usergroup = require('../models/forums/Usergroup');
const UserActivity = require('../models/forums/UserActivity');
const router = express.Router();

const { formatNameForProtocol, formatPlayerNameForDisplay } = require('../utils/format');

router.post('/', async(req, res) => {
    //TODO - add request limiter to prevent brute force attacks
    let username = req.body.username;
    let password = req.body.password;
    let sessionId = req.body.sessionId;
    let rights;
    try {
        rights = parseInt(req.body.rights);
    } catch (err) {
        rights = 0;
        console.error(err);
    }
    if (!username || !password) {
        res.status(400).send({ message: 'Missing username or password.' });
        return;
    }
    if (username.length < 3 || username.length > 20) {
        res.status(400).send({ message: 'Username must be between 3 and 20 characters.' });
        return;
    }
    if (password.length < 8 || password.length > 50) {
        res.status(400).send({ message: 'Password must be between 8 and 50 characters.' });
        return;
    }
    //make sure there are no special characters in username
    if (/[^a-zA-Z0-9_]/.test(username)) {
        res.status(400).send({ message: 'Username can only contain letters, numbers, and underscores.' });
        return;
    }

    username = username.toLowerCase().replace(" ", "_");
    let user = await User.findOne({ username });
    if (user) {
        res.status(400).send({ message: 'Username already exists.' });
        return;
    }
    let group = req.body.displayGroup;
    if (group) {
        group = await Usergroup.findOne({ _id: group });
        if (!group) {
            res.status(400).send({ message: 'Invalid display group.' });
            return;
        }
    }
    let displayName = formatPlayerNameForDisplay(username);
    let email = req.body.email || null;
    let hash = await bcrypt.hash(password, 10);
    user = new User({
        username,
        displayName,
        hash,
        email,
        rights,
        displayGroup: group,
        sessionId
    });
    try {
        await user.save();
        res.status(201).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error creating user.' });
    }
});

router.delete('/:id', async(req, res) => {
    // if (!res.loggedIn || res.loggedIn.rights < 2) {
    //     res.status(403).send({ message: 'Insufficient privileges.' });
    //     return;
    // }
    let id = req.params.id;
    let user = User.findOne({ username: id });
    if (!user)
        user = User.findById(id);
    if (!user) {
        res.status(404).send({ message: 'User not found.' });
        return;
    }
    try {
        await user.deleteOne();
        res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error deleting user.' });
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
        res.status(401).send({ message: 'Not logged in.' });
        return;
    }
    res.user.sessionId = '';
    try {
        await res.user.save();
        res.status(200).json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error logging out.' });
    }
});

router.post('/auth', async(req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let otp = req.body.otp;

    username = formatNameForProtocol(username);

    let user = await User.findOne({ username });
    if (!user) {
        res.status(200).send({ success: false });
        return;
    }
    if (user.tfaKey) {
        if (!otp) {
            res.status(200).send({ success: false, message: 'Two-factor authentication is enabled. Please provide the one-time password.' });
            return;
        }
        let secret = user.tfaKey;
        let verified = verify(secret, otp);
        if (!verified) {
            res.status(200).send({ success: false, message: 'Invalid one-time password.' });
            return;
        }
    }

    let valid = await bcrypt.compare(password, user.hash);
    let result = {
        success: valid,
    };
    if (valid) {
        result.sessionId = crypto.randomBytes(16).toString('base64');
        user.sessionId = result.sessionId;
        result.user = await user.save();
    }
    res.status(200).send(result);
});

router.post('/activity', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ message: 'Not logged in.' });
        return;
    }
    let activity = req.body.activity;
    if (!activity) {
        res.status(400).send({ message: 'Missing activity.' });
        return;
    }
    let userActivity = await UserActivity.findOne({ 'user._id': res.user._id });
    if (!userActivity) {
        userActivity = new UserActivity({
            user: res.user,
            activity: activity
        });
    } else {
        userActivity.activity = activity;
    }
    try {
        let savedActivity = await userActivity.save();
        res.status(200).json(savedActivity);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error saving user activity.' });
    }
});

module.exports = router;