const express = require('express');
const router = express.Router();
const Thread = require('../models/forums/Thread');

router.get('/thread/:id', async(req, res) => {
    let id = req.params.id;
    if (id == 'news') {
        let threads = await Thread.find({ forumId: [1, 2], archived: false }).sort({ createdAt: -1 }).limit(5);
        res.status(200).send(threads);
        return;
    }
    try {
        let thread = await Thread.findById(id);
        res.status(200).json(thread);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error getting thread.' });
    }
});

router.post('/thread', async(req, res) => {

    let thread = new Thread({
        forumId: req.body.forumId || 1,
        title: req.body.title,
        authorId: req.body.authorId || 0,
        firstPostID: req.body.firstPostID || 0,
        lastPostID: req.body.lastPostID || 0,
        lastPostAuthorId: req.body.lastPostAuthorId || 0,
    });

    try {
        let savedThread = await thread.save();
        res.status(201).json(savedThread);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error creating thread.' });
    }

});

module.exports = router;