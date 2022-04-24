const express = require('express');
const router = express.Router();

const MessageChain = require('../../../models/forums/private/MessageChain')

router.get('/:page', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ error: 'You must be logged in to view your inbox.' });
        return;
    }

    let page = Number(req.params.page) || 1;

    try {

        let chains = await MessageChain.find({ $or: [{ recipients: res.user }, { author: res.user }] })
            .sort({ createdAt: -1 })
            .skip((page - 1) * 10)
            .limit(10);

        let pageTotal = Math.ceil(await MessageChain.countDocuments({ $or: [{ recipient: res.user }, { author: res.user }] }) / 10);

        res.status(200).json({ chains, pageTotal });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Error getting inbox messages' });
    }
});

module.exports = router;