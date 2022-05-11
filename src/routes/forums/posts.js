const express = require('express');
const router = express.Router();
const ObjectId = require('mongoose').Types.ObjectId;

const BBCodeManager = require('../../utils/bbcode-manager');
const { mapPost } = require('../../utils/map-utils');
const { validate } = require('../../utils/validate');

const Post = require('../../models/forums/Post');
const Thread = require('../../models/forums/Thread');
const Thank = require('../../models/forums/Thank');
const User = require('../../models/User');

const validateContent = {
    content: {
        required: true,
        name: 'Post Content',
        min: 4,
        max: 1000,
    }
};

router.get('/:id', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ error: 'You must be logged in to view a post.' });
        return;
    }

    let id = req.params.id;
    if (!ObjectId.isValid(id)) {
        res.status(400).send({ error: 'Invalid post id.' });
        return;
    }

    try {

        let post = await Post.findById(id);
        if (!post) {
            res.status(404).send({ error: 'Post not found.' });
            return;
        }

        if (!post.thread.subforum.permissions.checkCanSee(res.user, post.thread)) {
            res.status(404).send({ error: 'Post not found.' });
            return;
        }

        post = mapPost(post, res.user);

        res.status(200).json({ post });

    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Error viewing post.' });
    }
});

router.post('/', async(req, res) => {

    if (!res.loggedIn) {
        res.status(401).send({ error: 'You must be logged in to post.' });
        return;
    }

    let threadId = req.body.threadId;
    let content = req.body.content;

    if (!ObjectId.isValid(threadId)) {
        res.status(400).send({ error: 'Invalid post id.' });
        return;
    }

    let [validated, error] = validate(validateContent, { content });

    if (!validated) {
        res.status(400).send({ error });
        return;
    }

    try {
        let thread = await Thread.findOne({ _id: threadId });
        if (!thread) {
            res.status(404).send({ error: 'Invalid thread id.' });
            return;
        }

        if (!thread.subforum.permissions.checkCanSee(res.user, thread) || !thread.subforum.permissions.checkCanReply(res.user)) {
            res.status(403).send({ error: 'You do not have permission to post in this forum.' });
            return;
        }

        let post = new Post({
            thread,
            author: res.user,
            content,
            subforum: thread.subforum
        });

        await post.save();

        post = mapPostWithValues(post);

        res.status(201).json({ post });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Error creating post.' });
    }

});

router.delete('/:id', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ error: 'You must be logged in to delete a post.' });
        return;
    }

    let id = req.params.id;
    if (!ObjectId.isValid(id)) {
        res.status(400).send({ error: 'Invalid post id.' });
        return;
    }

    try {

        let post = await Post.findById(id);
        if (!post) {
            res.status(404).send({ error: 'Post not found.' });
            return;
        }

        if (!post.thread.subforum.permissions.checkCanModerate(res.user)) {
            res.status(403).send({ error: 'You do not have permission to delete posts in this forum.' });
            return;
        }

        let firstPost = await post.find({ thread: post.thread._id }).sort({ createdAt: 1 }).limit(1);
        if (firstPost._id.equals(post._id)) {
            res.status(403).send({ error: 'You cannot delete the first post of a thread. Delete the thread above instead.' });
            return;
        }

        await post.remove();

        res.status(200).send();

    } catch (error) {
        console.error(error);
        res.status(500).send({ error });
    }
});

router.put('/:id', async(req, res) => {

    if (!res.loggedIn) {
        res.status(401).send({ error: 'You must be logged in to edit a post.' });
        return;
    }

    let id = req.params.id;
    let content = req.body.content;
    if (!ObjectId.isValid(id)) {
        res.status(400).send({ error: 'Invalid post id.' });
        return;
    }

    let [validated, error] = validate(validateContent, { content });

    if (!validated) {
        res.status(400).send({ error });
        return;
    }

    try {

        let post = await Post.findById(id);
        if (!post) {
            res.status(404).send({ error: 'Invalid post id.' });
            return;
        }
        if (!post.author.equals(res.user._id) && !post.thread.subforum.permissions.checkCanEdit(res.user, post)) {
            res.status(401).send({ error: 'You do not have permission to edit this post.' });
            return;
        }

        post.content = content;
        post.edited = new Date();

        await post.save();

        post = mapPost(post);

        res.status(200).json({ post });

    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Error editing post.' });
    }

});

module.exports = router;