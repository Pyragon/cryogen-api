const mongoose = require('mongoose-fill');
const Schema = mongoose.Schema;

const Permissions = require('./Permissions');

let schema = new Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    parent: {
        type: this,
        required: false,
    },
    isCategory: {
        type: Boolean,
        required: true,
    },
    permissions: {
        type: Permissions.schema,
        required: false,
    },
    priority: {
        type: Number,
        required: true,
    },
    link: {
        type: String,
        required: false,
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    }
});

schema.fill('extraData', async function(callback) {
    try {
        let Post = require('./Post');
        let Thread = require('./Thread');
        let post = await Post.findOne({ 'thread.subforum._id': this._id }).sort({ createdAt: -1 });
        let totalThreads = await Thread.countDocuments({ 'subforum._id': this._id });
        let totalPosts = await Post.countDocuments({ 'thread.subforum._id': this._id });
        let data = {
            lastPost: post,
            totalThreads,
            totalPosts
        };
        callback(null, data);
    } catch (err) {
        console.error(err);
        callback(null, null);
    }
});

const Subforum = mongoose.model('Subforum', schema);

module.exports = Subforum;