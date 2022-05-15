const express = require('express');
const router = express.Router();
const ObjectId = require('mongoose').Types.ObjectId;

const { validate, validateUsers } = require('../../../utils/validate');

const Message = require('../../../models/forums/private/Message');
const User = require('../../../models/User');

let validateOptions = {
    body: {
        required: false,
        type: 'string',
        name: 'Message',
        min: 5,
        max: 2000,
    },
    subject: {
        required: true,
        type: 'string',
        name: 'Subject',
        min: 3,
        max: 100
    }
};

router.get('/:page', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ error: 'You must be logged in to view your drafts.' });
        return;
    }

    let page = Number(req.params.page) || 1;

    try {
        //load from messages where chain is null
        let drafts = await Message.find({ chain: null, author: res.user })
            .sort({ createdAt: -1 })
            .skip((page - 1) * 10)
            .limit(10);

        let pageTotal = Math.ceil(await Message.countDocuments({ chain: null, author: res.user }) / 10);

        res.status(200).json({ drafts, pageTotal });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error getting drafts' });
    }
});

router.put('/:id', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ error: 'You must be logged in to update a draft.' });
        return;
    }

    let id = req.params.id;
    if (!ObjectId.isValid(id)) {
        res.status(400).send({ error: 'Invalid draft id.' });
        return;
    }

    try {
        let message = await Message.findById(id);
        if (!message) {
            res.status(404).send({ error: 'Draft not found.' });
            return;
        }
        if (!message.author._id.equals(res.user._id)) {
            res.status(404).send({ error: 'Draft not found.' });
            return;
        }

        let recipients = req.body.recipients;

        if (!Array.isArray(recipients))
            recipients = recipients.split(', ?');

        let [usersError, users] = await validateUsers(recipients, res.user);
        if (usersError) {
            res.status(400).send({ error: usersError });
            return;
        }

        recipients = users;

        let error = validate(validateOptions, { body: req.body.content, subject: req.body.subject });
        if (error) {
            res.status(400).send({ error });
            return;
        }

        message.content = req.body.content;
        message.subject = req.body.subject;
        message.recipients = recipients;

        let saved = await message.save();

        res.status(200).json({ message: saved });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error updating draft.' });
    }
});

router.delete('/:id', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ error: 'You must be logged in to delete a draft.' });
        return;
    }

    let id = req.params.id;
    if (!ObjectId.isValid(id)) {
        res.status(400).send({ error: 'Invalid draft id.' });
        return;
    }

    try {
        let message = await Message.findById(id);
        if (!message) {
            res.status(404).send({ error: 'Draft not found.' });
            return;
        }
        if (!message.author._id.equals(res.user._id)) {
            res.status(404).send({ error: 'Draft not found.' });
            return;
        }

        let deleted = await message.remove();

        res.status(200).json({ message: deleted });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error deleting draft.' });
    }
});

router.post('/', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ error: 'You must be logged in to save a draft.' });
        return;
    }

    let recipients = req.body.recipients;
    let subject = req.body.subject;
    let body = req.body.body;

    let error = validate(validateOptions, { body, subject });
    if (error) {
        res.status(400).send({ error });
        return;
    }

    if (!Array.isArray(recipients)) {
        if (recipients.length === 0)
            recipients = [];
        else
            recipients = recipients.split(', ?');
    }

    let [usersError, users] = await validateUsers(recipients, res.user);
    if (usersError) {
        res.status(400).send({ error: usersError });
        return;
    }

    recipients = users;

    try {
        let message = new Message({
            author: res.user,
            recipients: recipients,
            subject,
            content: body
        });

        await message.save();
        res.status(200).json({ message });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Unable to save draft' });
    }

});

module.exports = router;