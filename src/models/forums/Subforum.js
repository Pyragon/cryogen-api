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
        required: false,
        default: ''
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: 'Subforum',
        required: false,
    },
    isCategory: {
        type: Boolean,
        required: true,
    },
    permissions: {
        type: Schema.Types.ObjectId,
        ref: 'Permissions',
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
        let post = await Post.findOne({ 'subforum': this._id })
            .sort({ createdAt: -1 })
            .populate({
                path: 'author',
                model: 'User',
                populate: [{
                    path: 'displayGroup'
                }, {
                    path: 'usergroups'
                }]
            })
            .populate('thread');
        let totalThreads = await Thread.countDocuments({ 'subforum': this._id });
        let totalPosts = await Post.countDocuments({ 'subforum': this._id });
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