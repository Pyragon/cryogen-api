const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let Post = require('./Post');
let Thread = require('./Thread');

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
        autopopulate: true,
    },
    isCategory: {
        type: Boolean,
        required: true,
    },
    permissions: {
        type: Schema.Types.ObjectId,
        ref: 'Permissions',
        required: false,
        autopopulate: true,
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

schema.plugin(require('mongoose-autopopulate'));

schema.fill('subforums', async function(callback) {
    try {
        let subforums = await Subforum.find({ parent: this._id });
        callback(null, subforums);
    } catch (err) {
        console.error(err);
        callback(null, []);
    }
});

schema.fill('extraData', async function(callback) {
    try {
        let post = await Post.findOne({ subforum: this._id })
            .sort({ createdAt: -1 });
        let totalThreads = await Thread.countDocuments({ subforum: this._id });
        let totalPosts = await Post.countDocuments({ subforum: this._id });
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