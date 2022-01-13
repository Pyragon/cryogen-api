const express = require('express');
const router = express.Router();
const Thread = require('../../models/forums/Thread');
const Post = require('../../models/forums/Post');
const Subforum = require('../../models/forums/Subforum');
const User = require('../../models/User');

router.get('/:id', async(req, res) => {
    let id = req.params.id;
    if (id == 'news') {
        let threads = await Thread.find({ "subforum._id": ['61d54c83ecf018f2f6af60cb', '61d54c96ecf018f2f6af60ce'], archived: false })
            .sort({ createdAt: -1 })
            .limit(5)
            .fill('firstPost')
            .populate('subforum')
            .populate({
                path: 'author',
                model: 'User',
                populate: [{
                    path: 'displayGroup'
                }, {
                    path: 'usergroups'
                }]
            })

        res.status(200).send(threads);
        return;
    } else if (id == 'latest') {
        let threads = await Thread.find({ archived: false })
            .sort({ createdAt: 1 })
            .populate('subforum')
            // .populate({
            //     path: 'subforum',
            //     populate: {
            //         path: 'permissions',
            //         model: 'Permissions'
            //     }
            // })
            .populate({
                path: 'author',
                model: 'User',
                populate: [{
                    path: 'displayGroup'
                }, {
                    path: 'usergroups'
                }]
            })
            .limit(10);
        //TODO - has permissions to view (only show threads with 'all' permission)
        res.status(200).send(threads);
        return;
    }
    try {
        let thread = await Thread.findById(id)
            .fill('firstPost')
            .populate('subforum')
            .populate({
                path: 'author',
                model: 'User',
                populate: [{
                    path: 'displayGroup'
                }, {
                    path: 'usergroups'
                }]
            })
            .populate({
                path: 'subforum',
                populate: {
                    path: 'permissions',
                    model: 'Permissions'
                }
            });
        res.status(200).json(thread);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error getting thread.' });
    }
});

router.get('/children/:id', async(req, res) => {
    let subforumId = req.params.id;
    if (!subforumId) {
        res.status(400).send({ message: 'No id provided.' });
        return;
    }
    try {
        let subforum = await Subforum.findById(subforumId);
        if (!subforum) {
            res.status(404).send({ message: 'Subforum not found.' });
            return;
        }
        let threads = await Thread.find({ "subforum": subforumId, archived: false })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('subforum')
            .populate({
                path: 'author',
                model: 'User',
                populate: [{
                    path: 'displayGroup'
                }, {
                    path: 'usergroups'
                }]
            })
            .fill('postCount')
            .fill('firstPost')
            .fill('lastPost');
        res.status(200).send(threads);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error getting subforum.' });
    }
});

router.get('/:threadId/:postId', async(req, res) => {
    let threadId = req.params.threadId;
    let postId = req.params.postId;
    try {
        let thread = await Thread.findById(threadId)
            .fill('lastPost')
            .populate('subforum')
            .populate({
                path: 'author',
                model: 'User',
                populate: [{
                    path: 'displayGroup'
                }, {
                    path: 'usergroups'
                }]
            });
        let post = thread.posts.id(postId);
        res.status(200).json(post);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error getting post.' });
    }
});

router.post('/', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ message: 'You must be logged in to create a thread.' });
        return;
    }

    try {

        let subforum = await Subforum.findById(req.body.subforum).populate('permissions');
        if (!subforum) {
            res.status(400).send({ message: 'Invalid forum id.' });
            return;
        }

        if (!subforum.permissions.checkCanCreateThreads(res.user)) {
            res.status(403).send({ message: 'You do not have permission to create threads in this subforum.' });
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