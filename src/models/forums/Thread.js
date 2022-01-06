const mongoose = require('mongoose-fill');
const Schema = mongoose.Schema;

const Subforum = require('./Subforum');
const User = require('../User');

let schema = new Schema({
    subforum: {
        type: Subforum.schema,
        required: true
    },
    author: {
        type: User.schema,
        requried: true,
    },
    title: {
        type: String,
        required: true
    },
    open: {
        type: Boolean,
        required: false,
        default: true
    },
    archived: {
        type: Boolean,
        required: false,
        default: false
    },
    pinned: {
        type: Boolean,
        required: false,
        default: false
    },
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    }
});

schema.fill('lastPost', async function(callback) {
    try {
        let Post = require('./Post');
        let post = await Post.findOne({ 'thread._id': this._id }).sort({ createdAt: -1 });
        callback(null, post);
    } catch (err) {
        console.error(err);
        callback(null, null);
    }
});

schema.fill('firstPost', async function(callback) {
    try {
        let Post = require('./Post');
        let post = await Post.findOne({ 'thread._id': this._id }).sort({ createdAt: 1 });
        callback(null, post);
    } catch (err) {
        console.error(err);
        callback(null, null);
    }
});

schema.fill('postCount', async function(callback) {
    try {
        let Post = require('./Post');
        let count = await Post.countDocuments({ 'thread._id': this._id });
        callback(null, count - 1);
    } catch (err) {
        console.error(err);
        callback(null, null);
    }
});


const Thread = mongoose.model('Thread', schema);

module.exports = Thread;