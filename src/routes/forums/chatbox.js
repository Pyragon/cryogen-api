const express = require('express');
const router = express.Router();
const censor = require('../../utils/censor');

const ChatboxMessage = require('../../models/forums/ChatboxMessage');

router.get('/', async(req, res) => {
    try {
        let messages = await ChatboxMessage.find({
            createdAt: {
                $gte: new Date(Date.now() - (30 * 60 * 1000))
            }
        }).sort({ createdAt: 1 });
        res.status(200).send({ messages });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: err });
    }
});

router.post('/', async(req, res) => {
    let message = censor(req.body.message);
    let chatboxMessage = new ChatboxMessage({
        author: req.body.author,
        message
    });

    try {
        let savedMessage = await chatboxMessage.save();
        res.status(200).send(savedMessage);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: err });
    }
});

module.exports = router;