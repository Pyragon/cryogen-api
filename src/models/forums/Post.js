const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Thank = require('./Thank');

let schema = new Schema({
    thread: {
        type: Schema.Types.ObjectId,
        ref: 'Thread',
        required: true,
        autopopulate: true,
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        autopopulate: true,
    },
    subforum: {
        type: Schema.Types.ObjectId,
        ref: 'Subforum',
        required: true,
        autopopulate: true,
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

schema.plugin(require('mongoose-autopopulate'));

schema.methods.getThanks = async function() {
    return await Thank.find({ post: this._id });
};

const Post = mongoose.model('Post', schema);

module.exports = Post;