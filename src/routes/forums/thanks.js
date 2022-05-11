const express = require('express');
const router = express.Router();

router.post('/:id/thanks/remove', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ error: 'You must be logged in to remove your thanks.' });
        return;
    }

    let postId = req.params.id;
    try {
        let post = await Post.findById(postId);
        if (!post) {
            res.status(404).send({ error: 'Invalid post id.' });
            return;
        }
        let user = res.user;
        if (!post.thread.subforum.permissions.checkCanSee(user, post.thread)) {
            res.status(403).send({ error: 'You do not have permission to remove thanks in this subforum.' });
            return;
        }
        let thank = await Thank.findOne({ post: post._id, user });
        if (!thank) {
            res.status(404).send({ error: 'You have not thanked this post.' });
            return;
        }
        await thank.remove();
        res.status(200).json({ thanks: await post.getThanks() });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Error removing thanks.' });
    }
});

router.post('/:id/thanks', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ error: 'You must be logged in to thank a post.' });
        return;
    }

    let postId = req.params.id;
    let user = res.user;
    try {

        let post = await Post.findOne({ _id: postId });
        if (!post) {
            res.status(404).send({ error: 'Invalid post id.' });
            return;
        }
        if (!post.thread.subforum.permissions.checkCanSee(user, post.thread)) {
            res.status(403).send({ error: 'You do not have permission to add thanks in this subforum.' });
            return;
        }
        let thanks = await post.getThanks();
        if (thanks.includes(user)) {
            res.status(400).send({ error: 'Already thanked.' });
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
        res.status(500).send({ error: 'Error thanking post.' });
    }
});

module.exports = router;