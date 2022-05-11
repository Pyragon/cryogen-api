const ModerationLog = require('../models/forums/ModerationLog');

module.exports = function(user, id, type, action) {
    let log = new ModerationLog({
        user: user._id,
        typeId: id,
        type: type,
        action: action
    });
    try {
        log.save();
    } catch (err) {
        console.error(err);
    }
};