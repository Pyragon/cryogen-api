const express = require('express');
const router = express.Router();
const ObjectId = require('mongoose').Types.ObjectId;

const Message = require('../../../models/forums/private/Message');
const User = require('../../../models/User');

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

        recipients = await Promise.all(recipients.map(async(to) => {
            let recipient = await User.findOne({ username: to });
            if (!recipient) {
                res.status(400).send('Recipient ' + to + ' cannot be found');
                failed = true;
                return;
            }
            if (recipient._id.equals(res.user._id) && res.user.displayGroup.rights < 2) {
                res.status(400).send('You cannot send a message to yourself.');
                failed = true;
                return;
            }
            //todo check privacy settings, etc.
            //maybe continue even if they have author blocked, simply don't display it to them
            //that way people can't find out who they have blocked by simply sending them a message and seeing if it works
            return recipient;
        }));

        if (!req.body.subject) {
            res.status(400).send({ error: 'A subject must be filled out!' });
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
    if (!subject) {
        res.status(400).send({ error: 'A subject must be filled out!' });
        return;
    }

    if (!Array.isArray(recipients))
        recipients = recipients.split(', ?');

    recipients = await Promise.all(recipients.map(async(to) => {
        let recipient = await User.findOne({ username: to });
        if (!recipient) {
            res.status(400).send('Recipient ' + to + ' cannot be found');
            failed = true;
            return;
        }
        if (recipient._id.equals(res.user._id) && res.user.displayGroup.rights < 2) {
            res.status(400).send('You cannot send a message to yourself.');
            failed = true;
            return;
        }
        //todo check privacy settings, etc.
        //maybe continue even if they have author blocked, simply don't display it to them
        //that way people can't find out who they have blocked by simply sending them a message and seeing if it works
        return recipient;
    }));

    try {
        let message = new Message({
            author: res.user,
            recipients: recipients,
            subject,
            content: body
        });

        let savedDraft = await message.save();
        res.status(200).json({ message: savedDraft });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Unable to save draft' });
    }

});

module.exports = router;