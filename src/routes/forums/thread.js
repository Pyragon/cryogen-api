const express = require('express');
const router = express.Router();
const Thread = require('../../models/forums/Thread');
const Post = require('../../models/forums/Post');
const User = require('../../models/User');

router.get('/:id', async(req, res) => {
    let id = req.params.id;
    if (id == 'news') {
        let threads = await Thread.find({ forumId: [1, 2], archived: false })
            .sort({ createdAt: -1 })
            .limit(5);
        threads = await Promise.all(threads.map(async(thread) => {
            return {
                thread: await thread.mapValues(),
                posts: await Post.find({ threadId: thread._id }).sort({ createdAt: 1 }).limit(1)
            }
        }));
        res.status(200).send(threads);
        return;
    } else if (id == 'latest') {
        let threads = await Thread.find({ archived: false })
            .sort({ createdAt: 1 })
            .limit(10);
        //TODO - has permissions to view (only show threads with 'all' permission)
        threads = await Promise.all(threads.map(async(thread) => thread.mapValues()));
        res.status(200).send(threads);
        return;
    }
    try {
        let thread = await Thread.findById(id);
        thread = thread.mapValues();
        res.status(200).json(thread);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error getting thread.' });
    }
});

router.get('/:threadId/:postId', async(req, res) => {
    let threadId = req.params.threadId;
    let postId = req.params.postId;
    try {
        let thread = await Thread.findById(threadId);
        let post = thread.posts.id(postId);
        res.status(200).json(post);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error getting post.' });
    }
});

router.post('/:id', async(req, res) => {

});

router.post('/', async(req, res) => {

    let thread = new Thread({
        forumId: req.body.forumId || 1,
        title: req.body.title,
        author: req.body.author || "cody",
        firstPostID: req.body.firstPostID || "0",
        lastPostID: req.body.lastPostID || "0",
        lastPostAuthor: req.body.lastPostAuthorId || "cody",
    });

    let content = req.body.content;

    try {
        let savedThread = await thread.save();

        let post = new Post({
            threadId: savedThread._id,
            author: req.body.author || "cody",
            content
        });

        let savedPost = await post.save();
        res.status(201).json({ thread: savedThread, post: savedPost });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error creating thread.' });
    }

});

module.exports = router;