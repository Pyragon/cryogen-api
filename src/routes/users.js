const express = require('express');
const bcrypt = require('bcrypt');

const User = require('../models/User');
const router = express.Router();

const { formatNameForProtocol } = require('../utils/format');

router.post('/', async(req, res) => {
    //TODO - add request limiter to prevent brute force attacks
    let username = req.body.username;
    let password = req.body.password;
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
    let email = req.body.email || null;
    let hash = await bcrypt.hash(password, 10);
    user = new User({
        username,
        hash,
        email
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

router.post('/auth', async(req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let rememberMe = req.body.rememberMe;
    let otp = req.body.otp;

    username = formatNameForProtocol(username);

    let user = await User.findOne({ username });
    if (!user) {
        res.status(200).send({ success: false });
        return;
    }
    if (user.tfaKey && !otp) {
        res.status(200).send({ success: false, message: 'Two-factor authentication is enabled. Please provide the one-time password.' });
        return;
    }
    let valid = await bcrypt.compare(password, user.hash);
    let result = {
        success: valid,
    };
    if (valid) {

    }
    res.status(200).send(result);
});

module.exports = router;