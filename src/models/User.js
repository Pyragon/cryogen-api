const mongoose = require('mongoose-fill');
const Post = require('./forums/Post');
const Schema = mongoose.Schema;

const Usergroup = require('./forums/Usergroup');

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
    },
    avatar: {
        type: String,
        required: false,
    },
    displayName: {
        type: String,
        required: true,
    },
    lastDisplayName: {
        type: String,
        required: false,
    },
    displayNameDelay: {
        type: Date,
        required: false,
    },
    hash: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: false,
    },
    tempEmail: {
        type: String,
        required: false,
    },
    donator: {
        type: Number,
        required: false,
        default: 0
    },
    displayGroup: {
        type: Schema.Types.ObjectId,
        ref: 'Usergroup',
        required: false
    },
    usergroups: {
        type: [{
            type: Schema.Types.ObjectId,
            ref: 'Usergroup',
        }],
        required: false
    },
    recoveryQuestions: {
        type: Array,
        required: false,
        default: []
    },
    tfaKey: {
        type: String,
        required: false,
        default: null
    },
    sessionId: {
        type: String,
        required: false,
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    }
});

userSchema.methods.getPostCount = async function() {
    return await Post.countDocuments({ author: this._id });
}

userSchema.methods.getThanksReceived = async function() {
    return 1;
};

userSchema.methods.getThanksGiven = async function() {
    return 1;
};

const User = mongoose.model('User', userSchema);

module.exports = User;