const express = require('express');
const router = express.Router();
const Thread = require('../../models/forums/Thread');
const Post = require('../../models/forums/Post');
const Subforum = require('../../models/forums/Subforum');
const User = require('../../models/User');
const UserActivity = require('../../models/forums/UserActivity');
const saveModLog = require('../../utils/mod-logs');

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
            .limit(4);
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
            .limit(10)
            .fill('postCount')
            .fill('firstPost')
            .fill('lastPost');
        threads = threads.sort((a, b) => {
            if (a.pinned && !b.pinned)
                return -1;
            else if (!a.pinned && b.pinned)
                return 1;
            else
                return b.lastPost.createdAt - a.lastPost.createdAt;
        });
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

        let title = req.body.title;
        let content = req.body.content;

        if (title.length < 5 || title.length > 50) {
            res.status(400).send({ message: 'Title must be between 5 and 50 characters.' });
            return;
        }

        if (content.length < 4 || content.length > 1000) {
            res.status(400).send({ message: 'Content must be between 4 and 1000 characters.' });
            return;
        }

        let thread = new Thread({
            subforum,
            title,
            author: res.user
        });

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

router.post('/:id/pin', async(req, res) => {
    let id = req.params.id;
    try {
        let thread = await Thread.findById(id);
        if (!thread) {
            res.status(404).send({ message: 'Thread not found.' });
            return;
        }
        if (!thread.subforum.permissions.checkCanModerate(res.user, thread)) {
            res.status(403).send({ message: 'You do not have permission to pin or unpin this thread.' });
            return;
        }
        thread.pinned = !thread.pinned;
        let savedThread = await thread.save();
        saveModLog(res.user, savedThread._id, 'thread', (thread.pinned ? 'Pinned' : 'Unpinned') + ' thread');
        res.status(200).send({ thread: savedThread });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error locking thread.' });
    }
});

router.post('/:id/lock', async(req, res) => {
    let id = req.params.id;
    try {
        let thread = await Thread.findById(id);
        if (!thread) {
            res.status(404).send({ message: 'Thread not found.' });
            return;
        }
        if (!thread.subforum.permissions.checkCanModerate(res.user, thread)) {
            res.status(403).send({ message: 'You do not have permission to lock or unlock this thread.' });
            return;
        }
        thread.open = !thread.open;
        let savedThread = await thread.save();
        saveModLog(res.user, savedThread._id, 'thread', (thread.open ? 'Unlocked' : 'Locked') + ' thread');
        res.status(200).send({ thread: savedThread });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error locking thread.' });
    }
});

router.post('/:id/archive', async(req, res) => {
    let id = req.params.id;
    try {
        let thread = await Thread.findById(id);
        if (!thread) {
            res.status(404).send({ message: 'Thread not found.' });
            return;
        }
        if (!thread.subforum.permissions.checkCanModerate(res.user, thread)) {
            res.status(403).send({ message: 'You do not have permission to delete or restore this thread.' });
            return;
        }
        thread.archived = !thread.archived;
        let savedThread = await thread.save();
        res.status(200).send({ thread: savedThread });
        saveModLog(res.user, savedThread._id, 'thread', thread.archived ? 'Archived' : 'Restored');
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error archiving thread.' });
    }
});

module.exports = router;