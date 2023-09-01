const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Post = require('./Post');

let schema = new Schema({
    subforum: {
        type: Schema.Types.ObjectId,
        ref: 'Subforum',
        required: true,
        autopopulate: true,
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        autopopulate: true,
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
    poll: {
        type: Schema.Types.ObjectId,
        ref: 'Poll',
        required: false,
        autopopulate: true
    },
    archived: {
        type: Boolean,
        required: false,
        default: false
    },
    archivedStamp: {
        type: Date,
        required: false,
    },
    archivedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        autopopulate: true
    },
    pinned: {
        type: Boolean,
        required: false,
        default: false
    },
    views: {
        type: Number,
        required: false,
        default: 0
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    }
});

schema.fill('lastPost', async function(callback) {
    try {
        let post = await Post.findOne({ thread: this._id })
            .sort({ createdAt: -1 });
        callback(null, post);
    } catch (err) {
        console.error(err);
        callback(null, null);
    }
});

schema.fill('pageTotal', async function(callback) {
    try {
        let totalPosts = await Post.countDocuments({ thread: this._id });
        callback(null, Math.ceil(totalPosts / 10));
    } catch (err) {
        console.error(err);
        callback(null, 1);
    }
});

schema.fill('firstPost', async function(callback) {
    try {
        let post = await Post.findOne({ thread: this._id })
            .sort({ createdAt: 1 });
        callback(null, post);
    } catch (err) {
        console.error(err);
        callback(null, null);
    }
});

schema.fill('postCount', async function(callback) {
    try {
        let count = await Post.countDocuments({ thread: this._id });
        callback(null, count - 1);
    } catch (err) {
        console.error(err);
        callback(null, null);
    }
});

schema.plugin(require('mongoose-autopopulate'));

const Thread = mongoose.model('Thread', schema);

module.exports = Thread;