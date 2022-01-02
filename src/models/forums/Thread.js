const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let threadSchema = new Schema({
    forumId: {
        type: Number,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    authorId: {
        type: Number,
        required: true
    },
    firstPostID: {
        type: Number,
        required: true
    },
    lastPostID: {
        type: Number,
        required: true
    },
    lastPostAuthorId: {
        type: Number,
        required: true
    },
    lastPostTime: {
        type: Date,
        required: false,
        default: Date.now()
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

const Thread = mongoose.model('Thread', threadSchema);

module.exports = Thread;