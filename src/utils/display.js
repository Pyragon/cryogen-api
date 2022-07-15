const DisplayName = require('../models/account/DisplayName');
const { formatPlayerNameForDisplay, formatNameForProtocol } = require('./utils');

let getDisplayName = async(user) => {

    if (!user) return null;

    try {

        let displayName = await DisplayName.findOne({ user: user._id });
        if (!displayName) return formatPlayerNameForDisplay(user.username);

        return displayName.name;

    } catch (error) {
        console.error(error);
        return null;
    }
};

let getLastDisplayName = async(user) => {

    if (!user) return null;

    try {

        let displayName = await DisplayName.findOne({ user: user._id });
        if (!displayName) return null;

        return displayName.previous;

    } catch (error) {
        console.error(error);
        return null;
    }

};

let nameInUse = async(name) => {

    if (!name) return true;

    try {

        return await DisplayName.findOne({ $or: [{ name: name }, { previous: name }] }) != null;

    } catch (err) {
        console.error(err);
        return true;
    }
};

module.exports = { getDisplayName, getLastDisplayName, nameInUse };