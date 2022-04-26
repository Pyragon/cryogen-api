const express = require('express');
const router = express.Router();

const User = require('../../models/User');
const Thread = require('../../models/forums/Thread');
const Post = require('../../models/forums/Post');
const UserActivity = require('../../models/forums/UserActivity');
const MiscData = require('../../models/MiscData');


router.get('/', async(req, res) => {

    try {
        let userCount = await User.countDocuments();
        let threadCount = await Thread.countDocuments();
        let postCount = await Post.countDocuments();
        let online = await UserActivity.countDocuments({ updatedAt: { $gt: Date.now() - (1000 * 60 * 5) } });
        let mostOnline = await MiscData.findOne({ name: 'mostOnline' });
        if (!mostOnline)
            mostOnline = 0;
        else
            mostOnline = mostOnline.value;

        let stats = {
            registered: userCount,
            threads: threadCount,
            posts: postCount,
            online,
            mostOnline
        };

        res.status(200).send({ stats });

    } catch (err) {
        console.error(err);
        res.status(500).send({ error: err });
    }
});

router.get('/online', async(req, res) => {
    try {
        let online = await UserActivity.find({ updatedAt: { $gt: Date.now() - (1000 * 60 * 5) } });
        res.status(200).send({ users: online });
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: err });
    }
});

module.exports = router;