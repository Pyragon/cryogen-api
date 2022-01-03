const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = require('../User');
const Post = require('./Post');

let threadSchema = new Schema({
    forumId: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    author: {
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
}, { timestamps: true });

threadSchema.methods.mapValues = async function() {
    try {
        let author = await User.findOne({ username: this.author });
        this.author = author ? {
            username: author.username,
            rights: author.rights
        } : {
            username: 'Error',
            rights: 0
        };
        return this;
    } catch (err) {
        console.error(err);
    }
    return this;
};

const Thread = mongoose.model('Thread', threadSchema);

module.exports = Thread;