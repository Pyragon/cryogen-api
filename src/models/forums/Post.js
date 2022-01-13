const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Thank = require('./Thank');

let schema = new Schema({
    thread: {
        type: Schema.Types.ObjectId,
        ref: 'Thread',
        required: true,
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    subforum: {
        type: Schema.Types.ObjectId,
        required: true
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

schema.methods.getThanks = async function() {
    return await Thank.find({ post: this._id })
        .populate({
            path: 'user',
            model: 'User',
            populate: [{
                path: 'displayGroup'
            }, {
                path: 'usergroups'
            }]
        })
};

const Post = mongoose.model('Post', schema);

module.exports = Post;