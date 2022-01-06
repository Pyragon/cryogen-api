const mongoose = require('mongoose-fill');
const Schema = mongoose.Schema;

const Usergroup = require('./forums/Usergroup');

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
    },
    displayName: {
        type: String,
        required: true,
    },
    lastDisplayName: {
        type: String,
        required: false,
    },
    displayNameDelay: {
        type: Date,
        required: false,
    },
    hash: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: false,
    },
    tempEmail: {
        type: String,
        required: false,
    },
    donator: {
        type: Number,
        required: false,
        default: 0
    },
    displayGroup: {
        type: Usergroup.schema,
        required: false
    },
    usergroups: {
        type: [Usergroup.schema],
        required: false
    },
    recoveryQuestions: {
        type: Array,
        required: false,
        default: []
    },
    tfaKey: {
        type: String,
        required: false,
        default: null
    },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    }
});

userSchema.fill('postCount', async function(callback) {
    try {
        let Post = require('./Post');
        let count = await Post.countDocuments({ 'author._id': this._id });
        callback(null, count);
    } catch (err) {
        console.error(err);
        callback(null, null);
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;