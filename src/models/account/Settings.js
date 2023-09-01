const mongoose = require('mongoose-fill');
const BBCodeManager = require('../../utils/bbcode-manager');
const Schema = mongoose.Schema;

let schema = new Schema({
    avatar: {
        type: String,
        required: false,
    },
    banner: {
        type: String,
        required: false,
    },
    about: {
        type: String,
        required: false,
    },
    showDiscord: {
        type: Boolean,
        required: false,
        default: false,
    },
    showEmail: {
        type: Boolean,
        required: false,
        default: false,
    },
    allowMessages: {
        type: Boolean,
        required: false,
        default: true,
    },
    allowVisitorMessages: {
        type: Boolean,
        required: false,
        default: true,
    },
    allowFriendRequests: {
        type: Boolean,
        required: false,
        default: true,
    },
    showInGameTotal: {
        type: Boolean,
        required: false,
        default: true,
    }
});

schema.plugin(require('mongoose-autopopulate'));

let model = mongoose.model('UserSetting', schema);

module.exports = model;