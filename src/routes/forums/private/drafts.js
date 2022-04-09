const express = require('express');
const router = express.Router();

let DraftMessage = require('../../../models/forums/private/DraftMessage');

router.post('/', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ message: 'You must be logged in to save a draft.' });
        return;
    }

    let recipients = req.body.recipients;
    let subject = req.body.subject;
    let body = req.body.body;
    if (!recipients && !subject && !body) {
        res.status(400).send({ message: 'At least one field must be filled out.' });
        return;
    }

    try {
        let draftMessage = new DraftMessage({
            author: res.user,
            recipients,
            subject,
            body
        });

        let savedDraft = await draftMessage.save();
        res.status(200).json(savedDraft);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Unable to save draft' });
    }

});

module.exports = router;