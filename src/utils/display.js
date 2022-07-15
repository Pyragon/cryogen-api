const DisplayName = require('../models/account/DisplayName');

let nameInUse = async(name) => {

    if (!name) return true;

    try {

        return await DisplayName.findOne({ $or: [{ name: name }, { previous: name }] }) != null;

    } catch (err) {
        console.error(err);
        return true;
    }
};

module.exports = { nameInUse };