const express = require('express');
const router = express.Router();
const Thread = require('../../models/forums/Thread');
const Post = require('../../models/forums/Post');
const Subforum = require('../../models/forums/Subforum');
const User = require('../../models/User');
const UserActivity = require('../../models/forums/UserActivity');

router.get('/:id', async(req, res) => {
    let id = req.params.id;
    if (id == 'news') {
        let threads = await Thread.find({ "subforum": ['61dfccd67065e8ce789105d9'], archived: false })
            .sort({ createdAt: -1 })
            .limit(5)
            .fill('firstPost');
        res.status(200).send(threads);
        return;
    } else if (id == 'latest') {
        let threads = await Thread.find({ archived: false })
            .sort({ createdAt: -1 })
            .limit(10);
        threads = threads.filter(thread => thread.subforum.permissions.checkCanSee(res.user, thread));
        res.status(200).send(threads);
        return;
    }
    try {
        let thread = await Thread.findById(id)
            .fill('firstPost')
            .fill('pageTotal')
            .fill('lastPost')
            .fill('postCount');
        if (!thread) {
            res.status(404).send({ message: 'Thread not found.' });
            return;
        }
        if (!thread.subforum.permissions.checkCanSee(res.user, thread)) {
            res.status(403).send({ message: 'You do not have permission to view this thread.' });
            return;
        }
        res.status(200).json(thread);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error getting thread.' });
    }
});

router.get('/:id/users', async(req, res) => {
    let id = req.params.id;
    try {
        let thread = await Thread.findById(id);
        if (!thread) {
            res.status(404).send({ message: 'Thread not found.' });
            return;
        }
        if (!thread.subforum.permissions.checkCanSee(res.user, thread)) {
            res.status(403).send({ message: 'You do not have permission to view this thread.' });
            return;
        }
        let users = await UserActivity.find({
            type: 'thread',
            id: id,
            updatedAt: {
                $gte: new Date(Date.now() - (5 * 60 * 1000))
            }
        });
        res.status(200).json(users);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error getting users.' });
    }
});

router.get('/children/:id', async(req, res) => {
    let id = req.params.id;

    if (!id) {
        res.status(400).send({ message: 'No id provided.' });
        return;
    }
    try {
        let subforum = await Subforum.findById(id);
        if (!subforum) {
            res.status(404).send({ message: 'Subforum not found.' });
            return;
        }
        if (!subforum.permissions.checkCanSee(res.user)) {
            res.status(403).send({ message: 'You do not have permission to view this subforum.' });
            return;
        }
        let threads = await Thread.find({ subforum: id, archived: false })
            .sort({ createdAt: -1 })
            .limit(10)
            .fill('postCount')
            .fill('firstPost')
            .fill('lastPost');
        res.status(200).send(threads);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error getting subforum.' });
    }
});

router.post('/', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ message: 'You must be logged in to create a thread.' });
        return;
    }

    try {

        let subforum = await Subforum.findById(req.body.subforum);
        if (!subforum) {
            res.status(400).send({ message: 'Invalid forum id.' });
            return;
        }

        if (!subforum.permissions.checkCanSee(res.user) || !subforum.permissions.checkCanCreateThreads(res.user)) {
            res.status(403).send({ message: 'You do not have permission to create threads in this subforum.' });
            return;
        }

        if (subforum.isCategory) {
            res.status(400).send({ message: 'Categories cannot have threads.' });
            return;
        }

        let thread = new Thread({
            subforum,
            title: req.body.title,
            author: res.user
        });

        let content = req.body.content;

        let savedThread = await thread.save();

        let post = new Post({
            thread: savedThread,
            author: res.user,
            content,
            subforum
        });

        let savedPost = await post.save();
        res.status(201).json({ thread: savedThread, post: savedPost });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error creating thread.' });
    }

});

module.exports = router;