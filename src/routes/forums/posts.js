const express = require('express');
const router = express.Router();
const ObjectId = require('mongoose').Types.ObjectId;

const BBCodeManager = require('../../utils/bbcode-manager');

const Post = require('../../models/forums/Post');
const Thread = require('../../models/forums/Thread');
const Thank = require('../../models/forums/Thank');
const User = require('../../models/User');

router.get('/:id', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ message: 'You must be logged in to view a post.' });
        return;
    }

    let id = req.params.id;
    if (!ObjectId.isValid(id)) {
        res.status(400).send({ message: 'Invalid post id.' });
        console.error('Invalid post id.');
        return;
    }

    try {

        let post = await Post.findById(id);
        if (!post) {
            res.status(404).send({ message: 'Post not found.' });
            console.error('Post not found.');
            return;
        }

        if (!post.thread.subforum.permissions.checkCanSee(res.user, post.thread)) {
            res.status(404).send({ message: 'Post not found.' });
            console.error('Does not have permission to view this post.');
            return;
        }

        res.status(200).json({ post });

    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error viewing post.' });
    }
});

router.post('/', async(req, res) => {

    if (!res.loggedIn) {
        res.status(401).send({ message: 'You must be logged in to post.' });
        return;
    }

    let threadId = req.body.threadId;
    let content = req.body.content;
    let user = res.user;

    if (content.length < 4 || content.length > 1000) {
        res.status(200).send({ message: 'Content must be between 4 and 1000 characters.' });
        return;
    }

    try {
        let thread = await Thread.findOne({ _id: threadId });
        if (!thread) {
            res.status(404).send({ message: 'Invalid thread id.' });
            return;
        }

        if (!thread.subforum.permissions.checkCanSee(user, thread) || !thread.subforum.permissions.checkCanReply(user)) {
            res.status(403).send({ message: 'You do not have permission to post in this subforum.' });
            return;
        }

        let post = new Post({
            thread,
            author: user,
            content,
            subforum: thread.subforum
        });
        let savedPost = await post.save();

        let results = {
            post: savedPost,
            postCount: await user.getPostCount(),
            thanksReceived: await user.getThanksReceived(),
            thanksGiven: await user.getThanksGiven(),
            thanks: await savedPost.getThanks()
        };
        //return page the new post is on, send notification asking if they want to go to the page
        //after they've posted

        res.status(201).json(results);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error creating post.' });
    }

});

router.post('/:id/thanks/remove', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ message: 'You must be logged in to remove your thanks.' });
        return;
    }

    let postId = req.params.id;
    try {
        let post = await Post.findById(postId);
        if (!post) {
            res.status(404).send({ message: 'Invalid post id.' });
            return;
        }
        let user = res.user;
        if (!post.thread.subforum.permissions.checkCanSee(user, post.thread)) {
            res.status(403).send({ message: 'You do not have permission to remove thanks in this subforum.' });
            return;
        }
        let thank = await Thank.findOne({ post: post._id, user });
        if (!thank) {
            res.status(404).send({ message: 'You have not thanked this post.' });
            return;
        }
        await thank.remove();
        res.status(200).json({ thanks: await post.getThanks() });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error removing thanks.' });
    }
});

router.post('/:id/thanks', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ message: 'You must be logged in to thank a post.' });
        return;
    }

    let postId = req.params.id;
    let user = res.user;
    try {

        let post = await Post.findOne({ _id: postId });
        if (!post) {
            res.status(404).send({ message: 'Invalid post id.' });
            return;
        }
        if (!post.thread.subforum.permissions.checkCanSee(user, post.thread)) {
            res.status(403).send({ message: 'You do not have permission to add thanks in this subforum.' });
            return;
        }
        let thanks = await post.getThanks();
        if (thanks.includes(user)) {
            res.status(400).send({ message: 'Already thanked.' });
            return;
        }
        let thanksSchema = new Thank({
            post: post._id,
            user,
            author: post.author
        });
        await thanksSchema.save();
        res.status(201).json({ thanks: await post.getThanks() });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error thanking post.' });
    }
});

router.post('/:id/delete', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ message: 'You must be logged in to delete a post.' });
        return;
    }
    let page = req.body.page;
    let postId = req.params.id;
    try {
        let post = await Post.findById(postId);
        if (!post) {
            res.status(404).send({ message: 'Invalid post id.' });
            return;
        }
        let user = res.user;
        if (!post.thread.subforum.permissions.checkCanModerate(user)) {
            res.status(403).send({ message: 'You do not have permission to delete posts in this subforum.' });
            return;
        }
        let firstPost = await post.find({ thread: post.thread._id }).sort({ createdAt: 1 }).limit(1);
        if (firstPost._id.equals(post._id)) {
            res.status(403).send({ message: 'You cannot delete the first post of a thread. Delete the thread above instead.' });
            return;
        }
        await post.remove();

        let totalPosts = await Post.countDocuments({ thread: post.thread._id });
        if ((page - 1) * 10 >= totalPosts) {
            res.status(404).send({ message: 'Invalid page.' });
            return;
        }

        let posts = await Post.find({ thread: post.thread._id })
            .skip((page - 1) * 10)
            .limit(10)
            .sort({ createdAt: -1 });
        let counts = [],
            received = [],
            given = [];
        let index = (page - 1) * 10;
        posts = await Promise.all(posts.map(async(post) => {
            let user = await User.findOne({ _id: post.author._id });
            let postCount = counts[user.username] || await user.getPostCount();
            let thanksReceived = received[user.username] || await user.getThanksReceived();
            let thanksGiven = given[user.username] || await user.getThanksGiven();
            counts[user.username] = postCount;
            received[user.username] = thanksReceived;
            given[user.username] = thanksGiven;
            let results = {
                index: index++,
                post,
                postCount,
                thanksReceived,
                thanksGiven,
                thanks: await post.getThanks()
            };
            return results;
        }));
        posts = posts.sort((a, b) => a.post.createdAt - b.post.createdAt);
        res.status(200).send({ posts });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error deleting post.' });
    }
});

router.put('/:id', async(req, res) => {

    if (!res.loggedIn) {
        res.status(401).send({ message: 'You must be logged in to edit a post.' });
        return;
    }

    let postId = req.params.id;
    let content = req.body.content;

    if (content.length < 4 || content.length > 1000) {
        res.status(200).send({ message: 'Content must be between 4 and 1000 characters.' });
        return;
    }

    try {

        let post = await Post.findOne({ _id: postId });
        if (!post) {
            res.status(404).send({ message: 'Invalid post id.' });
            return;
        }
        if (!post.author.equals(res.user._id) && !post.thread.subforum.permissions.checkCanModerate(res.user)) {
            res.status(401).send({ message: 'You cannot edit this post.' });
            return;
        }
        post.content = content;
        post.edited = new Date();

        await post.save();

        let bbcodeManager = new BBCodeManager(post);
        let results = {
            ...post._doc,
            formatted: await bbcodeManager.getFormattedPost(res.user),
        }
        res.status(200).json({ post: results });

    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error editing post.' });
    }

});

router.get('/children/:id/:page', async(req, res) => {
    let parentId = req.params.id;
    let page = req.params.page || 1;
    if (!parentId) {
        res.status(400).send({ message: 'No id provided.' });
        return;
    }
    try {
        let thread = await Thread.findOne({ _id: parentId });

        if (!thread || !thread.subforum.permissions.checkCanSee(res.user, thread)) {
            res.status(404).send({ message: 'Invalid thread id.' });
            return;
        }

        let totalPosts = await Post.countDocuments({ thread: thread._id });
        if ((page - 1) * 10 >= totalPosts) {
            res.status(404).send({ message: 'Invalid page.' });
            return;
        }

        let posts = await Post.find({ thread: thread._id })
            .skip((page - 1) * 10)
            .limit(10)
            .sort({ createdAt: -1 });
        let counts = [],
            received = [],
            given = [];
        let index = (page - 1) * 10;
        posts = await Promise.all(posts.map(async(post) => {
            let user = await User.findOne({ _id: post.author._id });
            let postCount = counts[user.username] || await user.getPostCount();
            let thanksReceived = received[user.username] || await user.getThanksReceived();
            let thanksGiven = given[user.username] || await user.getThanksGiven();
            counts[user.username] = postCount;
            received[user.username] = thanksReceived;
            given[user.username] = thanksGiven;
            let bbcodeManager = new BBCodeManager(post);
            let results = {
                index: index++,
                post: {
                    ...post._doc,
                    formatted: await bbcodeManager.getFormattedPost(res.user)
                },
                postCount,
                thanksReceived,
                thanksGiven,
                thanks: await post.getThanks()
            };
            return results;
        }));
        res.status(200).send(posts);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error getting posts.' });
    }
});

module.exports = router;