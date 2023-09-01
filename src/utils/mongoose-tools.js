const mongoose = require('mongoose');
const props = require('../../data/props.json');

const DisplayName = require('../models/account/DisplayName');
const UserSetting = require('../models/account/Settings');
const User = require('../models/User');

async function setup() {

    mongoose.connect(props.connectionString, { useNewUrlParser: true });

    let settings = new UserSetting({});

    await settings.save();

    let user = await User.findOne({ username: 'cody' });
    if (!user) {
        console.log('ya done fucked up a-a-ron');
        process.exit(1);
    }

    user.settings = settings._id;

    await user.save();

    process.exit(1);
}

setup();