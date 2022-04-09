const express = require('express');
const router = express.Router();

const User = require('../../../models/User');
const InboxMessage = require('../../../models/forums/private/InboxMessage');
const SentMessage = require('../../../models/forums/private/SentMessage');

router.post('/', async(req, res) => {

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

        recipients = await Promise.all(recipients.map(async(to) => {
            let recipient = await User.findOne({ username: to });
            if (!recipient) {
                res.status(400).send('Recipient ' + to + ' cannot be found');
                return;
            }
            return recipient;
        }));

        for (let recipient of recipients) {

            let inboxMessage = new InboxMessage({
                author: res.user,
                recipient,
                subject,
                body
            });

            await inboxMessage.save();

        }

        let sentMessage = new SentMessage({
            author: res.user,
            recipients,
            subject,
            body
        });

        await sentMessage.save();
        res.status(200).json(sentMessage);

    } catch (err) {
        console.error(err);
        res.status(500).send({ message: err });
    }

});

module.exports = router;