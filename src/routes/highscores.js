const express = require('express');
const router = express.Router();

const Highscore = require('../models/Highscore');
const User = require('../models/User');

router.get('/mini', async(req, res) => {

    try {
        //get the top 10 highscores based on level, xp, xpstamp
        let highscores = await Highscore.find({})
            .sort({ totalLevel: -1, totalXP: -1, totalXPStamp: -1 })
            .limit(10);
        res.status(200).send(highscores);
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Error getting highscores.' });
    }
});

router.post('/', async(req, res) => {
    if (req.hostname != 'localhost') {
        res.status(403).send({ error: 'Insufficient permissions' });
        return;
    }

    let highscores = new Highscore({
        user: res.user,
        username: req.body.username,
        totalLevel: req.body.totalLevel,
        totalXP: req.body.totalXP,
        totalXPStamp: Date.now(),
        xp: req.body.xp,
        timestamps: req.body.timestamps
    });

    try {

        let highscore = await Highscore.findOne({ username: req.body.username });
        if (highscore) {
            highscore.totalLevel = req.body.totalLevel;
            highscore.totalXP = req.body.totalXP;
            highscore.totalXPStamp = totalXP != req.body.totalXP ? Date.now() : highscore.totalXPStamp;
            highscore.xp = req.body.xp;
            highscore.timestamps = req.body.timestamps;
            await highscore.save();
        } else {
            await highscores.save();
        }

        res.status(201).json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error });
    }

});

module.exports = router;