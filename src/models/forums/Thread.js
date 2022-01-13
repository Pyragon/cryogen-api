const mongoose = require('mongoose-fill');
const Schema = mongoose.Schema;

const Subforum = require('./Subforum');
const User = require('../User');

let schema = new Schema({
    subforum: {
        type: Schema.Types.ObjectId,
        ref: 'Subforum',
        required: true
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
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
        let post = await Post.findOne({ 'thread': this._id })
            .sort({ createdAt: -1 }).populate({
                path: 'author',
                model: 'User',
                populate: [{
                    path: 'displayGroup'
                }, {
                    path: 'usergroups'
                }]
            })
        callback(null, post);
    } catch (err) {
        console.error(err);
        callback(null, null);
    }
});

schema.fill('firstPost', async function(callback) {
    try {
        let Post = require('./Post');
        let post = await Post.findOne({ 'thread': this._id })
            .sort({ createdAt: 1 }).populate({
                path: 'author',
                model: 'User',
                populate: [{
                    path: 'displayGroup'
                }, {
                    path: 'usergroups'
                }]
            })
        callback(null, post);
    } catch (err) {
        console.error(err);
        callback(null, null);
    }
});

schema.fill('postCount', async function(callback) {
    try {
        let Post = require('./Post');
        let count = await Post.countDocuments({ 'thread': this._id });
        callback(null, count - 1);
    } catch (err) {
        console.error(err);
        callback(null, null);
    }
});


const Thread = mongoose.model('Thread', schema);

module.exports = Thread;