const express = require('express');
const router = express.Router();

const User = require('../models/User');
const Thread = require('../models/forums/Thread');
const Post = require('../models/forums/Post');


router.get('/stats', async(req, res) => {

    try {
        let userCount = await User.countDocuments();
        let threadCount = await Thread.countDocuments();
        let postCount = await Post.countDocuments();

        let stats = {
            registered: userCount,
            threads: threadCount,
            posts: postCount,
            online: 0,
            mostOnline: 0
        };

        res.status(200).send(stats);

    } catch (err) {
        console.error(err);
        res.status(500).send({ message: err });
    }
});

module.exports = router;