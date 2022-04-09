const express = require('express');
const router = express.Router();

const InboxMessage = require('../../../models/forums/private/InboxMessage');

router.get('/:page', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ message: 'You must be logged in to view your inbox.' });
        return;
    }

    let page = Number(req.params.page) || 1;

    try {

        let messages = await InboxMessage
            .find({ recipient: res.user._id, archived: false })
            .skip((page - 1) * 10)
            .limit(10)
            .sort({ createdAt: -1 });

        let pageTotal = Math.ceil(await InboxMessage.countDocuments({ recipient: res.user._id, archived: false }) / 10);

        res.status(200).json({ messages, pageTotal });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error getting inbox messages' });
    }
});

router.post('/:id/delete', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ message: 'You must be logged in to delete a message.' });
        return;
    }

    let id = req.params.id;

    try {
        let message = await InboxMessage.findOne({ _id: id, recipient: res.user._id });

        if (!message) {
            res.status(404).send({ message: 'Message not found.' });
            return;
        }

        message.archived = true;
        await message.save();

        res.status(200).send({ message: 'Message deleted.' });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error deleting message.' });
    }
});

router.post('/:id/mark', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ message: 'You must be logged in to mark this message.' });
        return;
    }

    let id = req.params.id;

    try {
        let message = await InboxMessage.findOne({ _id: id, recipient: res.user._id });

        if (!message) {
            res.status(404).send({ message: 'Message not found.' });
            return;
        }

        message.readAt = message.readAt ? null : Date.now();
        let savedMessage = await message.save();

        res.status(200).json({ message: savedMessage });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error marking message' });
    }
});

module.exports = router;