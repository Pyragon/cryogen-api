const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let schema = new Schema({
    threadId: {
        type: String,
        required: true,
    },
    author: {
        type: String,
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

schema.methods.mapValues = async function() {};

const Post = mongoose.model('Post', schema);

module.exports = Post;