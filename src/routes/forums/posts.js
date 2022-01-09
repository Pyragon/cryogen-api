const express = require('express');
const router = express.Router();

const Post = require('../../models/forums/Post');
const Thread = require('../../models/forums/Thread');
const User = require('../../models/User');

router.post('/', async(req, res) => {

    let threadId = req.body.threadId;
    let content = req.body.content;
    let author = 'cody'; //get from res.user
    let thanks = req.body.thanks || [];

    try {
        thanks = await Promise.all(thanks.map(async(thanked) => await User.findOne({ username: thanked })));
        let user = await User.findOne({ username: author });
        let thread = await Thread.findOne({ _id: threadId });
        if (!thread) {
            res.status(404).send({ message: 'Invalid thread id.' });
            return;
        }
        let post = new Post({
            thread,
            author: user,
            content,
            thanks
        });

        let savedPost = await post.save();
        res.status(201).json({ post: savedPost });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error creating post.' });
    }

});

router.post('/thanks', async(req, res) => {
    let postId = req.body.postId;
    let author = 'cody'; //get from res.user
    try {

        let post = await Post.findOne({ _id: postId });
        if (!post) {
            res.status(404).send({ message: 'Invalid post id.' });
            return;
        }
        let user = await User.findOne({ username: author });
        if (!user) {
            res.status(404).send({ message: 'Invalid author.' });
            return;
        }
        if (post.thanks.includes(user)) {
            res.status(400).send({ message: 'Already thanked.' });
            return;
        }
        post.thanks.push(user);
        await post.save();
        res.status(201).json({ post });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error thanking post.' });
    }
});

router.get('/children/:id', async(req, res) => {
    let parentId = req.params.id;
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