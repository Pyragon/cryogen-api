const express = require('express');
const router = express.Router();
const ObjectId = require('mongoose').Types.ObjectId;

const User = require('../../../models/User');
const Message = require('../../../models/forums/private/Message');
const Thank = require('../../../models/forums/Thank');
const MessageChain = require('../../../models/forums/private/MessageChain');
const BBCodeManager = require('../../../utils/bbcode-manager');

const { validate, validateUsers } = require('../../../utils/validate');

let validateSubject = {
    required: true,
    name: 'Subject',
    type: 'string',
    min: 3,
    max: 100,
};

let validateContent = {
    required: true,
    name: 'Body',
    type: 'string',
    min: 5,
    max: 2000,
};

let validateOptionsForChain = {
    subject: validateSubject,
    body: validateContent,
};

router.get('/chain/:chain/:page', async(req, res) => {

    if (!res.loggedIn) {
        res.status(401).send({ error: 'You must be logged in to view a chain.' });
        return;
    }

    let chain = req.params.chain;
    let page = Number(req.params.page) || 1;
    if (!ObjectId.isValid(chain)) {
        res.status(400).send({ error: 'Invalid chain id.' });
        return;
    }
    try {
        let messageChain = await MessageChain.findById(chain);
        if (!messageChain) {
            res.status(404).send({ error: 'Chain not found.' });
            return;
        }
        if (!messageChain.author._id.equals(res.user._id) && !messageChain.recipients.includes(res.user._id)) {
            res.status(404).send({ error: 'Chain not found.' });
            return;
        }

        //remove user from notify
        for (let i = 0; i < messageChain.notifyUsersWarning.length; i++) {
            if (messageChain.notifyUsersWarning[i]._id.equals(res.user._id)) {
                messageChain.notifyUsersWarning.splice(i, 1);
                await messageChain.save();
                break;
            }
        }
        let messages = await Message.find({ chain: chain })
            .sort({ createdAt: 1 })
            .skip((page - 1) * 5)
            .limit(5);

        let pageTotal = Math.ceil(await Message.countDocuments({ chain: chain }) / 5);

        messages = await Promise.all(messages.map(async message => {
            let bbcodeManager = new BBCodeManager(message);
            return {
                message: {
                    ...message._doc,
                    formatted: await bbcodeManager.getFormattedPost(res.user),
                },
                thanks: await message.getThanks()
            }
        }));

        res.status(200).send({ chain, messages, pageTotal });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error getting chain.' });
    }
});

router.post('/chain', async(req, res) => {

    if (!res.loggedIn) {
        res.status(401).send({ error: 'You must be logged in to send a message.' });
        return;
    }

    let recipients = req.body.recipients;
    let subject = req.body.subject;
    let body = req.body.body;

    try {

        if (!Array.isArray(recipients))
            recipients = recipients.split(', ?');

        let [usersError, users] = await validateUsers(recipients, res.user);
        if (usersError) {
            res.status(400).send({ error: usersError });
            return;
        }

        recipients = users;

        let [validated, error] = validate(validateOptionsForChain, { subject, body });
        if (!validated) {
            res.status(400).send({ error });
            return;
        }

        let notifyUsersWarning = [...recipients];

        let chain = new MessageChain({
            author: res.user,
            recipients,
            subject,
            notifyUsersWarning,
        });

        await chain.save();

        let message = new Message({
            chain,
            author: res.user,
            recipients,
            content: body,
        });

        await message.save();

        res.status(200).send({ chain, message });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: err });
    }

});

router.post('/', async(req, res) => {

    if (!res.loggedIn) {
        res.status(401).send({ error: 'You must be logged in to send a message.' });
        return;
    }

    let chain = req.body.chain;
    let content = req.body.content;
    if (!ObjectId.isValid(chain)) {
        res.status(400).send({ error: 'Invalid chain id.' });
        return;
    }

    try {

        let messageChain = await MessageChain.findById(chain);
        if (!messageChain) {
            res.status(404).send({ error: 'Chain not found.' });
            return;
        }
        if (!messageChain.author._id.equals(res.user._id) && !messageChain.recipients.includes(res.user._id)) {
            res.status(404).send({ error: 'Chain not found.' });
            return;
        }

        let [validated, error] = validate({ content: validateContent }, { content });
        if (!validated) {
            res.status(400).send({ error });
            return;
        }

        let message = new Message({
            chain,
            author: res.user,
            recipients: messageChain.recipients,
            content
        });

        await message.save();

        let thanks = await message.getThanks();

        res.status(200).send({ message, thanks });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error sending message.' });
    }

});

router.post('/:id/thanks', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ error: 'You must be logged in to thank a message.' });
        return;
    }

    let id = req.params.id;
    if (!ObjectId.isValid(id)) {
        res.status(400).send({ error: 'Invalid message id.' });
        console.error('Invalid message id.');
        return;
    }
    try {
        let message = await Message.findById(id);
        if (!message) {
            res.status(404).send({ error: 'Message not found.' });
            console.error('Message not found.');
            return;
        }
        if (!message.author._id.equals(res.user._id) && !message.recipients.includes(res.user._id)) {
            res.status(404).send({ error: 'Message not found.' });
            console.error('Message not found2.');
            return;
        }
        let thanks = await message.getThanks();
        if (thanks.some(thank => thank.user._id.equals(res.user._id))) {
            res.status(400).send({ error: 'You have already thanked this message.' });
            console.error('You have already thanked this message.');
            return;
        }
        let thanksSchema = new Thank({
            post: message._id,
            user: res.user,
            author: message.author
        });
        await thanksSchema.save();
        res.status(201).json({ thanks: await message.getThanks() });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error thanking message.' });
    }
});

router.post('/:id/thanks/remove', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ error: 'You must be logged in to remove a thank.' });
        return;
    }

    let id = req.params.id;
    if (!ObjectId.isValid(id)) {
        res.status(400).send({ error: 'Invalid message id.' });
        console.error('Invalid message id.');
        return;
    }

    try {
        let message = await Message.findById(id);
        if (!message) {
            res.status(404).send({ error: 'Message not found.' });
            console.error('Message not found.');
            return;
        }
        if (!message.author._id.equals(res.user._id) && !message.recipients.includes(res.user._id)) {
            res.status(404).send({ error: 'Message not found.' });
            console.error('Message not found2.');
            return;
        }
        let thanks = await message.getThanks();
        if (!thanks.some(thank => thank.user._id.equals(res.user._id))) {
            res.status(400).send({ error: 'You have not thanked this message.' });
            console.error('You have not thanked this message.');
            return;
        }
        await Thank.deleteOne({ post: message._id, user: res.user._id });
        res.status(200).json({ thanks: await message.getThanks() });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error removing thank.' });
    }
});

module.exports = router;