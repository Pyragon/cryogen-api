const express = require('express');
const router = express.Router();
const censor = require('../../utils/censor');
const { formatMessage } = require('../../utils/format');

const ChatboxMessage = require('../../models/forums/ChatboxMessage');
const User = require('../../models/User');

router.get('/', async(req, res) => {
    try {
        let messages = await ChatboxMessage.find({
                createdAt: {
                    $gte: new Date(Date.now() - (30 * 60 * 1000))
                }
            }).populate({
                path: 'author',
                model: 'User',
                populate: [{
                    path: 'displayGroup'
                }, {
                    path: 'usergroups'
                }]
            })
            .sort({ createdAt: 1 });
        res.status(200).send({ messages: messages });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: err });
    }
});

router.post('/', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ message: 'You must be logged in to post.' });
        console.log('not logged in');
        return;
    }
    //TODO - permissions
    //TODO - switch to use socketio
    let message = formatMessage(req.body.message);
    message = censor(message);
    if (message.length < 4 || message.length > 200) {
        res.status(400).send({ message: 'Message must be between 4 and 200 characters long.' });
        return;
    }
    let chatboxMessage = new ChatboxMessage({
        author: res.user,
        message
    });

    try {
        let savedMessage = await chatboxMessage.save();
        res.status(200).send({ message: savedMessage });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: err });
    }
});

module.exports = router;