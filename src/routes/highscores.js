const express = require('express');
const router = express.Router();

const Highscore = require('../models/Highscore');
const User = require('../models/User');

const { getLevelForXp } = require('../utils/utils');

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
    if (!res.loggedIn || res.user.displayGroup.rights < 2) {
        res.status(401).send({ error: 'You are not authorized to do this.' });
        return;
    }

    let xp = req.body.xp;
    let totalXP = xp.reduce((a, b) => a + b, 0);
    let totalLevel = 0;
    for (let i = 0; i < xp.length; i++) {
        let lvl = getLevelForXp(i, xp[i]);
        console.log(i, lvl);
        totalLevel += lvl;
    }

    let username = req.body.username;
    let user = await User.findOne({ username });
    if (!user) {
        res.status(400).send({ error: 'User not found.' });
        return;
    }

    try {
        let highscore = await Highscore.findOne({ user });
        if (highscore) {
            highscore.totalLevel = totalLevel;
            highscore.totalXPStamp = highscore.totalXP != totalXP ? Date.now() : highscore.totalXPStamp;
            highscore.totalXP = totalXP;
            let stamps = [];
            for (let i = 0; i < xp.length; i++)
                stamps.push(highscore.xp[i] != xp[i] ? Date.now() : highscore.xpStamps[i]);
            highscore.xp = xp;
            highscore.xpStamps = stamps;
        } else {
            let stamps = [];
            for (let i = 0; i < xp.length; i++)
                stamps.push(Date.now());
            highscore = new Highscore({
                user,
                totalLevel: totalLevel,
                totalXP: totalXP,
                totalXPStamp: Date.now(),
                xp: xp,
                xpStamps: stamps
            });
        }
        await highscore.save();

        res.status(201).json({ highscore });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error });
    }

});

module.exports = router;