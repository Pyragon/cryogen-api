const express = require('express');
const router = express.Router();
const ObjectId = require('mongoose').Types.ObjectId;

const User = require('../../../models/User');
const Message = require('../../../models/forums/private/Message');
const Thank = require('../../../models/forums/Thank');
const MessageChain = require('../../../models/forums/private/MessageChain');

router.get('/chain/:chain/:page', async(req, res) => {

    if (!res.loggedIn) {
        res.status(401).send({ message: 'You must be logged in to view a chain.' });
        return;
    }

    let chain = req.params.chain;
    let page = Number(req.params.page) || 1;
    if (!ObjectId.isValid(chain)) {
        res.status(400).send({ message: 'Invalid chain id.' });
        return;
    }
    try {
        let messageChain = await MessageChain.findById(chain);
        if (!messageChain) {
            res.status(404).send({ message: 'Chain not found.' });
            return;
        }
        if (!messageChain.author._id.equals(res.user._id) && !messageChain.recipients.includes(res.user._id)) {
            res.status(404).send({ message: 'Chain not found.' });
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
            return {
                message,
                thanks: await message.getThanks()
            }
        }));

        res.status(200).send({ chain, messages, pageTotal });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error getting chain.' });
    }
});

router.post('/chain', async(req, res) => {

    if (!res.loggedIn) {
        res.status(401).send({ message: 'You must be logged in to send a message.' });
        return;
    }

    let recipients = req.body.recipients;
    let subject = req.body.subject;
    let body = req.body.body;

    try {

        if (!recipients || !subject || !body) {
            res.status(400).send('All fields must be filled out.');
            return;
        }

        if (body.length < 5 || body.length > 2000) {
            console.error('Body must be between 5 and 2000 characters.');
            return;
        }

        if (!Array.isArray(recipients))
            recipients = [recipients];

        let failed = false;

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

        if (failed) return;

        let notifyUsersWarning = [...recipients];

        let chain = new MessageChain({
            author: res.user,
            recipients,
            subject,
            notifyUsersWarning,
        });

        let savedChain = await chain.save();

        let message = new Message({
            chain: savedChain,
            author: res.user,
            recipients,
            content: body,
        });

        let savedMessage = await message.save();

        res.status(200).send({ chain: savedChain, message: savedMessage });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: err });
    }

});

router.post('/', async(req, res) => {

    if (!res.loggedIn) {
        res.status(401).send({ message: 'You must be logged in to send a message.' });
        return;
    }

    let chain = req.body.chain;
    let content = req.body.content;

    try {

        if (!chain || !content) {
            res.status(400).send({ error: 'All fields must be filled out.' });
            return;
        }
        if (content.length < 5 || content.length > 2000) {
            console.error({ error: 'Content must be between 5 and 2000 characters.' });
            return;
        }

        if (!ObjectId.isValid(chain)) {
            res.status(400).send({ error: 'Invalid chain id.' });
            return;
        }

        let messageChain = await MessageChain.findById(chain);
        if (!messageChain) {
            res.status(404).send({ error: 'Chain not found.' });
            return;
        }
        if (!messageChain.author._id.equals(res.user._id) && !messageChain.recipients.includes(res.user._id)) {
            res.status(404).send({ error: 'Chain not found.' });
            return;
        }

        let message = new Message({
            chain,
            author: res.user,
            recipients: messageChain.recipients,
            content
        });

        let savedMessage = await message.save();

        let thanks = await message.getThanks();

        res.status(200).send({ message: savedMessage, thanks });
    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error sending message.' });
    }

});

router.post('/:id/thanks', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ message: 'You must be logged in to thank a message.' });
        return;
    }

    let id = req.params.id;
    if (!ObjectId.isValid(id)) {
        res.status(400).send({ message: 'Invalid message id.' });
        console.error('Invalid message id.');
        return;
    }
    try {
        let message = await Message.findById(id);
        if (!message) {
            res.status(404).send({ message: 'Message not found.' });
            console.error('Message not found.');
            return;
        }
        if (!message.author._id.equals(res.user._id) && !message.recipients.includes(res.user._id)) {
            res.status(404).send({ message: 'Message not found.' });
            console.error('Message not found2.');
            return;
        }
        let thanks = await message.getThanks();
        if (thanks.some(thank => thank.user._id.equals(res.user._id))) {
            res.status(400).send({ message: 'You have already thanked this message.' });
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
        res.status(500).send({ message: 'Error thanking message.' });
    }
});

router.post('/:id/thanks/remove', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ message: 'You must be logged in to remove a thank.' });
        return;
    }

    let id = req.params.id;
    if (!ObjectId.isValid(id)) {
        res.status(400).send({ message: 'Invalid message id.' });
        console.error('Invalid message id.');
        return;
    }

    try {
        let message = await Message.findById(id);
        if (!message) {
            res.status(404).send({ message: 'Message not found.' });
            console.error('Message not found.');
            return;
        }
        if (!message.author._id.equals(res.user._id) && !message.recipients.includes(res.user._id)) {
            res.status(404).send({ message: 'Message not found.' });
            console.error('Message not found2.');
            return;
        }
        let thanks = await message.getThanks();
        if (!thanks.some(thank => thank.user._id.equals(res.user._id))) {
            res.status(400).send({ message: 'You have not thanked this message.' });
            console.error('You have not thanked this message.');
            return;
        }
        await Thank.deleteOne({ post: message._id, user: res.user._id });
        res.status(200).json({ thanks: await message.getThanks() });
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error removing thank.' });
    }
});

module.exports = router;