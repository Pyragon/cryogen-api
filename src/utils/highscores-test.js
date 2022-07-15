const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cliProgress = require('cli-progress');

const props = require('../../data/props.json');
const constants = require('./constants');
const { getLevelForXp } = require('./utils');

const User = require('../models/User');
const Highscore = require('../models/Highscore');

async function start() {

    mongoose.connect(props.connectionString, { useNewUrlParser: true });

    //delete any previous tests using regex
    await User.deleteMany({ username: { $regex: /^test\d+/ } });
    const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

    console.log('Creating test users...');

    bar.start(1000, 0);

    let users = [];

    let hash = await bcrypt.hash('sdfsdfsdf', 10);

    //create 1000 test users test0-test999
    for (let i = 0; i < 1000; i++) {
        let user = new User({
            username: `test${i}`,
            displayName: `Test ${i}`,
            hash,
            creationIp: '127.0.0.1',
            email: 'test@cryogen-rsps.com',
            displayGroup: constants['REGULAR_USERGROUP']
        });

        await user.save();
        users[i] = user;

        bar.increment();
    }

    bar.stop();

    console.log('Test users created.');
    console.log('Creating highscores for test users...');

    bar.start(1000, 0);

    for (let i = 0; i < 1000; i++) {
        let xp = [];
        for (let j = 0; j < 25; j++)
            xp.push(Math.floor(Math.random() * 15000000));
        let totalXP = xp.reduce((a, b) => a + b, 0);
        let totalLevel = 0;
        for (let j = 0; j < 25; j++)
            totalLevel += getLevelForXp(j, xp[j]);
        let stamps = [];
        for (let j = 0; j < 25; j++)
            stamps.push(Date.now());
        let highscore = new Highscore({
            user: users[i],
            totalLevel,
            totalLevelStamp: Date.now(),
            totalXP,
            totalXPStamp: Date.now(),
            xp,
            xpStamps: stamps
        });

        await highscore.save();

        bar.increment();
    }

    bar.stop();

    console.log('Highscores created.');

    process.exit(0);

    //create highscores for said 1000 users

}

start();