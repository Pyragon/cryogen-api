const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Thread = require('./Thread');
const User = require('./../User');

let schema = new Schema({
    thread: {
        type: Thread.schema,
        required: true,
    },
    author: {
        type: User.schema,
        required: true,
    },
    content: {
        type: String,
        required: true,
    },
    edited: {
        type: Date,
        required: false,
    }
}, { timestamps: true });

const Post = mongoose.model('Post', schema);

module.exports = Post;