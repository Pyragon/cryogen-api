const express = require('express');
const router = express.Router();
const ObjectId = require('mongoose').Types.ObjectId;
const { validate } = require('../../utils/validate');

const Thread = require('../../models/forums/Thread');
const Post = require('../../models/forums/Post');
const Poll = require('../../models/forums/Poll');
const Subforum = require('../../models/forums/Subforum');
const User = require('../../models/User');
const UserActivity = require('../../models/forums/UserActivity');
const ThreadView = require('../../models/forums/ThreadView');
const BBCodeManager = require('../../utils/bbcode-manager');
const saveModLog = require('../../utils/mod-logs');
const constants = require('../../utils/constants');

router.get('/:id', async(req, res) => {
    let id = req.params.id;
    if (id == 'news') {
        let threads = await Thread.find({ "subforum": [constants['ANNOUNCEMENTS_SUBFORUM']], archived: false })
            .sort({ createdAt: -1 })
            .limit(5)
            .fill('firstPost');
        res.status(200).send({ threads });
        return;
    } else if (id == 'latest') {
        let threads = await Thread.find({ archived: false })
            .sort({ createdAt: -1 })
            .limit(4);
        threads = threads.filter(thread => thread.subforum.permissions.checkCanSee(res.user, thread));
        res.status(200).send({ threads });
        return;
    }
    try {
        if (!ObjectId.isValid(id)) {
            res.status(400).send({ error: 'Invalid ID.' });
            return;
        }
        let thread = await Thread.findById(id)
            .fill('firstPost')
            .fill('pageTotal')
            .fill('lastPost')
            .fill('postCount');
        if (!thread) {
            res.status(404).send({ error: 'Thread not found.' });
            return;
        }
        if (!thread.subforum.permissions.checkCanSee(res.user, thread)) {
            res.status(403).send({ error: 'You do not have permission to view this thread.' });
            return;
        }
        let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

        let threadView = await ThreadView.findOne({ thread, ip });
        if (!threadView)
            threadView = new ThreadView({ thread, ip, expiry: Date.now() + (1000 * 60 * 60) });
        else if (Date.now() > threadView.expiry)
            threadView.expiry = Date.now() + (1000 * 60 * 60);
        else threadView = null;

        if (threadView) {
            thread.views++;
            await threadView.save();
            await thread.save();
        }

        res.status(200).json({ thread });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Error getting thread.' });
    }
});

router.get('/:id/users', async(req, res) => {
    let id = req.params.id;
    if (!ObjectId.isValid(id)) {
        res.status(400).send({ error: 'Invalid ID.' });
        return;
    }
    try {
        let thread = await Thread.findById(id);
        if (!thread) {
            res.status(404).send({ error: 'Thread not found.' });
            return;
        }
        if (!thread.subforum.permissions.checkCanSee(res.user, thread)) {
            res.status(403).send({ error: 'You do not have permission to view this thread.' });
            return;
        }
        let users = await UserActivity.find({
            type: 'thread',
            activityId: id,
            updatedAt: {
                $gte: new Date(Date.now() - (5 * 60 * 1000))
            }
        });
        res.status(200).json({ activities: users });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Error getting users.' });
    }
});

router.get('/:id/posts/:page', async(req, res) => {

    try {

        let id = req.params.id;
        let page = Number(req.params.page) || 1;

        if (!ObjectId.isValid(id)) {
            res.status(400).send({ error: 'Invalid ID.' });
            return;
        }

        let thread = await Thread.findById(id);
        if (!thread) {
            res.status(404).send({ error: 'Thread not found.' });
            return;
        }
        if (!thread.subforum.permissions.checkCanSee(res.user, thread)) {
            res.status(403).send({ error: 'You do not have permission to view this thread.' });
            return;
        }
        let posts = await Post.find({ thread: id })
            .sort({ createdAt: 1 })
            .skip((page - 1) * 10)
            .limit(10);

        let counts = [],
            received = [],
            given = [],
            levels = [];
        let index = (page - 1) * 10;
        let users = [];
        posts = await Promise.all(posts.map(async(post) => {
            let user = users[post.author._id] || await User.findOne({ _id: post.author._id });
            users[post.author._id] = user;
            if (!counts[user.username])
                counts[user.username] = await user.getPostCount();
            if (!received[user.username])
                received[user.username] = await user.getThanksReceived();
            if (!given[user.username])
                given[user.username] = await user.getThanksGiven();
            if (!levels[user.username])
                levels[user.username] = await user.getTotalLevel();
            let bbcodeManager = new BBCodeManager(post);
            let results = {
                index: index++,
                ...post._doc,
                formatted: await bbcodeManager.getFormattedPost(res.user),
                postCount: counts[user.username],
                thanksReceived: received[user.username],
                thanksGiven: given[user.username],
                thanks: await post.getThanks(),
                totalLevel: levels[user.username],
            };
            return results;
        }));
        res.status(200).send({ posts });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error getting posts.' });
    }
});

router.post('/', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ error: 'You must be logged in to create a thread.' });
        return;
    }

    try {

        let subforum = await Subforum.findById(req.body.subforum);
        if (!subforum) {
            res.status(400).send({ error: 'Invalid forum id.' });
            return;
        }

        if (!subforum.permissions.checkCanSee(res.user) || !subforum.permissions.checkCanCreateThreads(res.user)) {
            res.status(403).send({ error: 'You do not have permission to create threads in this subforum.' });
            return;
        }

        if (subforum.isCategory) {
            res.status(400).send({ error: 'Categories cannot have threads.' });
            return;
        }

        let title = req.body.title;
        let content = req.body.content;
        let question = req.body.question;
        let options = req.body.pollOptions;

        let poll;

        let validateOptions = {
            title: {
                required: true,
                type: 'string',
                name: 'Title',
                min: 5,
                max: 50,
            },
            content: {
                required: true,
                type: 'string',
                name: 'Content',
                min: 4,
                max: 1000,
            }
        }

        let error = validate(validateOptions, { title, content });
        if (error) {
            res.status(400).send({ error });
            return;
        }

        if (question) {
            let pollOptions = [];
            if (question.length < 5 || question.length > 50) {
                console.error('Question must be between 5 and 50 characters.');
                return;
            }
            for (let i = 0; i < 6; i++) {
                if (!options[i]) continue;
                let option = options[i];
                if (pollOptions.includes(option)) {
                    console.error('You cannot have duplicate answers.');
                    return;
                }
                if (option.length < 4 || option.length > 25) {
                    console.error('Answers must be between 4 and 25 characters.');
                    return;
                }
                pollOptions.push(option);
            }
            if (pollOptions.length < 2) {
                console.error('You must have at least two answers.');
                return;
            }
            let votes = [];
            poll = new Poll({
                question,
                answers: pollOptions,
                votes
            });

            poll = await poll.save();
        }

        let thread = new Thread({
            subforum,
            title,
            author: res.user,
            poll,
        });

        await thread.save();

        if (poll) {
            poll.threadId = savedThread._id;
            await poll.save();
        }

        let post = new Post({
            thread,
            author: res.user,
            content,
            subforum
        });

        await post.save();

        res.status(201).json({ thread, post });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Error creating thread.' });
    }
});

router.post('/polls/vote', async(req, res) => {
    let id = req.body.poll;
    if (!ObjectId.isValid(id)) {
        res.status(400).send({ error: 'Invalid ID.' });
        return;
    }
    let index = parseInt(req.body.index);
    let remove = req.body.remove;
    try {
        let poll = await Poll.findById(id);
        if (!poll) {
            res.status(404).send({ error: 'Poll not found.' });
            return;
        }
        let thread = await Thread.findById(poll.threadId);
        if (!thread) {
            res.status(404).send({ error: 'Thread not found.' });
            return;
        }
        if (!thread.subforum.permissions.checkCanSee(res.user, poll.thread)) {
            res.status(403).send({ error: 'You do not have permission to vote in this poll.' });
            return;
        }

        if (remove) {
            if (!poll.allowVoteChange) {
                res.status(403).send({ error: 'You have already voted and this poll does not allow you to change your vote.' });
                return;
            }
            for (let i = 0; i < poll.votes.length; i++) {
                let vote = poll.votes[i];
                if (vote.user._id.equals(res.user._id))
                    poll.votes.splice(i, 1);
            }
            await poll.save();
            res.status(200).send({ poll });
            return;
        }

        for (let i = 0; i < poll.votes.length; i++) {
            let vote = poll.votes[i];
            if (vote.user._id === res.user._id) {
                if (!poll.allowVoteChange) {
                    res.status(403).send({ error: 'You have already voted and this poll does not allow you to change your vote.' });
                    return;
                }
                poll.votes.splice(i, 1);
            }
        }

        poll.votes.push({
            user: res.user,
            index
        });

        await poll.save();
        res.status(200).send({ poll });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Error voting.', error: err });
    }
});

router.post('/:id/pin', async(req, res) => {
    let id = req.params.id;
    if (!ObjectId.isValid(id)) {
        res.status(400).send({ error: 'Invalid ID.' });
        return;
    }
    try {
        let thread = await Thread.findById(id)
            .fill('firstPost')
            .fill('pageTotal')
            .fill('lastPost')
            .fill('postCount');
        if (!thread) {
            res.status(404).send({ error: 'Thread not found.' });
            return;
        }
        if (!thread.subforum.permissions.checkCanModerate(res.user, thread)) {
            res.status(403).send({ error: 'You do not have permission to pin or unpin this thread.' });
            return;
        }
        thread.pinned = !thread.pinned;
        await thread.save();

        saveModLog(res.user, thread._id, 'thread', (thread.pinned ? 'Pinned' : 'Unpinned') + ' thread');

        res.status(200).send({ thread });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Error locking thread.' });
    }
});

router.post('/:id/lock', async(req, res) => {
    let id = req.params.id;
    if (!ObjectId.isValid(id)) {
        res.status(400).send({ error: 'Invalid ID.' });
        return;
    }
    try {
        let thread = await Thread.findById(id)
            .fill('firstPost')
            .fill('pageTotal')
            .fill('lastPost')
            .fill('postCount');
        if (!thread) {
            res.status(404).send({ error: 'Thread not found.' });
            return;
        }
        if (!thread.subforum.permissions.checkCanModerate(res.user, thread)) {
            res.status(403).send({ error: 'You do not have permission to lock or unlock this thread.' });
            return;
        }
        thread.open = !thread.open;
        await thread.save();

        saveModLog(res.user, thread._id, 'thread', (thread.open ? 'Unlocked' : 'Locked') + ' thread');

        res.status(200).send({ thread });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Error locking thread.' });
    }
});

router.post('/:id/archive', async(req, res) => {
    let id = req.params.id;
    if (!ObjectId.isValid(id)) {
        res.status(400).send({ error: 'Invalid ID.' });
        return;
    }
    try {
        let thread = await Thread.findById(id)
            .fill('firstPost')
            .fill('pageTotal')
            .fill('lastPost')
            .fill('postCount');
        if (!thread) {
            res.status(404).send({ error: 'Thread not found.' });
            return;
        }
        if (!thread.subforum.permissions.checkCanModerate(res.user, thread)) {
            res.status(403).send({ error: 'You do not have permission to delete or restore this thread.' });
            return;
        }
        thread.archived = !thread.archived;
        await thread.save();
        saveModLog(res.user, thread._id, 'thread', thread.archived ? 'Archived' : 'Restored' + ' thread');

        res.status(200).send({ thread });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Error archiving thread.' });
    }
});

module.exports = router;