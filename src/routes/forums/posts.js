const express = require('express');
const router = express.Router();

const Post = require('../../models/forums/Post');

router.get('/children/:id', async(req, res) => {
    let parentId = req.params.id;
    console.log(parentId);
    if (!parentId) {
        res.status(400).send({ message: 'No id provided.' });
        return;
    }
    try {
        let posts = await Post.find({ 'thread._id': parentId }).sort({ priority: -1 }).limit(10);
        res.status(200).send(posts);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error getting posts.' });
    }
});

module.exports = router;