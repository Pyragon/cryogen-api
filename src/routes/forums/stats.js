const express = require('express');
const router = express.Router();

const User = require('../../models/User');
const Thread = require('../../models/forums/Thread');
const Post = require('../../models/forums/Post');
const UserActivity = require('../../models/forums/UserActivity');


router.get('/', async(req, res) => {

    try {
        let userCount = await User.countDocuments();
        let threadCount = await Thread.countDocuments();
        let postCount = await Post.countDocuments();
        let online = await UserActivity.countDocuments({ lastActivity: { $gt: Date.now() - 1000 * 60 * 5 } });

        let stats = {
            registered: userCount,
            threads: threadCount,
            posts: postCount,
            online,
            mostOnline: 0
        };

        res.status(200).send(stats);

    } catch (err) {
        console.error(err);
        res.status(500).send({ message: err });
    }
});

router.get('/online', async(req, res) => {
    try {
        let online = await UserActivity.find({ lastActivity: { $gt: Date.now() - 1000 * 60 * 5 } });
        res.status(200).send(online);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: err });
    }
});

module.exports = router;