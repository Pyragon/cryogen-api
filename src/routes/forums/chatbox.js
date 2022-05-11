const express = require('express');
const router = express.Router();
const censor = require('../../utils/censor');
const constants = require('../../utils/constants');
const { formatMessage } = require('../../utils/utils');

const { validate } = require('../../utils/validate');

const ChatboxMessage = require('../../models/forums/ChatboxMessage');

router.get('/', async(req, res) => {
    try {
        let messages = await ChatboxMessage.find({
                createdAt: {
                    $gte: new Date(Date.now() - (30 * 60 * 1000))
                }
            })
            .sort({ createdAt: 1 });
        res.status(200).send({ messages: messages });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: err });
    }
});

router.post('/', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ error: 'You must be logged in to post.' });
        return;
    }
    let user = res.user;

    if (user.displayGroup._id.equals(constants['BANNED_USERGROUP']) || user.usergroups.includes(constants['BANNED_USERGROUP'])) {
        res.status(403).send({ error: 'You are banned from posting.' });
        return;
    }

    let chatboxMutedGroup = user.usergroups.find(group => group._id.equals(constants['CHATBOX_MUTED_USERGROUP']));
    if (chatboxMutedGroup) {
        res.status(403).send({ error: 'You are muted from the chatbox.' });
        return;
    }

    let [validated, error] = validate({
        message: {
            required: true,
            name: 'Chatbox Message',
            min: 4,
            max: 200
        }
    }, { message: req.body.message });

    if (!validated) {
        res.status(400).send({ error });
        return;
    }

    let message = formatMessage(req.body.message);
    message = censor(message);

    let chatboxMessage = new ChatboxMessage({
        author: res.user,
        content: message,
    });

    try {

        await chatboxMessage.save();
        res.status(200).send({ message: chatboxMessage });

    } catch (err) {
        console.error(err);
        res.status(500).send({ error: err });
    }
});

module.exports = router;