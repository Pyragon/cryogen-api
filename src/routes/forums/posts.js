const express = require('express');
const router = express.Router();

const Post = require('../../models/forums/Post');
const Thread = require('../../models/forums/Thread');
const Thank = require('../../models/forums/Thank');
const User = require('../../models/User');

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
        let thread = await Thread.findOne({ _id: threadId })
            .populate({
                path: 'subforum',
                populate: {
                    path: 'permissions',
                    model: 'Permissions'
                }
            });
        if (!thread) {
            res.status(404).send({ message: 'Invalid thread id.' });
            return;
        }

        if (!thread.subforum.permissions.checkCanReply(user)) {
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
        res.status(201).json({ post: savedPost });
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
        let thank = await Thank.findOne({ post, user });
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
            console.log('invalid post id');
            res.status(404).send({ message: 'Invalid post id.' });
            return;
        }
        let thanks = await post.getThanks();
        if (thanks.includes(user)) {
            res.status(400).send({ message: 'Already thanked.' });
            return;
        }
        let thanksSchema = new Thank({
            post,
            user
        });
        await thanksSchema.save();
        res.status(201).json({ thanks: await post.getThanks() });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error thanking post.' });
    }
});

router.post('/:id/edit', async(req, res) => {

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

        let post = await Post.findOne({ _id: postId })
            .populate({
                path: 'thread',
                populate: {
                    path: 'subforum',
                    populate: {
                        path: 'permissions',
                        model: 'Permissions'
                    }
                }
            });
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
        res.status(200).json({ post });

    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error editing post.' });
    }

});

router.get('/children/:id', async(req, res) => {
    let parentId = req.params.id;
    if (!parentId) {
        res.status(400).send({ message: 'No id provided.' });
        return;
    }
    try {
        let thread = await Thread.findOne({ _id: parentId })
            .populate({
                path: 'subforum',
                populate: {
                    path: 'permissions',
                    model: 'Permissions'
                }
            });

        if (!thread || !thread.subforum.permissions.checkCanSee(res.user, thread)) {
            res.status(404).send({ message: 'Invalid thread id.' });
            return;
        }

        let posts = await Post.find({ 'thread': thread._id })
            .sort({ priority: -1 })
            .limit(10)
            .populate({
                path: 'thread',
                populate: {
                    path: 'subforum',
                    model: 'Subforum',
                    populate: {
                        path: 'permissions',
                        model: 'Permissions',
                    }
                }
            })
            .populate({
                path: 'author',
                model: 'User',
                populate: [{
                    path: 'displayGroup'
                }, {
                    path: 'usergroups'
                }]
            })
        posts = await Promise.all(posts.map(async(post) => {
            let user = await User.findOne({ _id: post.author._id });
            let results = {
                post,
                postCount: await user.getPostCount(),
                thanksReceived: await user.getThanksReceived(),
                thanksGiven: await user.getThanksGiven(),
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