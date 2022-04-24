const mongoose = require('mongoose-fill');
const Post = require('./forums/Post');
const Schema = mongoose.Schema;

const Usergroup = require('./forums/Usergroup');
const Highscore = require('./Highscore');
const Thank = require('./forums/Thank');
const Thread = require('./forums/Thread');
const Highscores = require('../utils/highscores');

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
    discord: {
        type: String,
        required: false,
    },
    creationIp: {
        type: String,
        required: true,
    },
    displayGroup: {
        type: Schema.Types.ObjectId,
        ref: 'Usergroup',
        required: false,
        autopopulate: true,
    },
    usergroups: {
        type: [{
            type: Schema.Types.ObjectId,
            ref: 'Usergroup',
        }],
        required: false,
        autopopulate: true,
    },
    recoveryQuestions: {
        type: [Object], // { question: index, answer: String }, NOTE WHEN CREATING THAT THE ANSWER WILL HAVE TO BE EXACT (CASE INSENSITIVE)
        required: false,
        default: [],
    },
    previousPasswords: {
        type: [String],
        required: false,
        default: [],
    },
    tfaKey: {
        type: String,
        required: false,
        default: null
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    }
});

userSchema.plugin(require('mongoose-autopopulate'));

userSchema.methods.getPostCount = async function() {
    return await Post.countDocuments({ author: this._id });
};

userSchema.methods.getThreadsCreated = async function() {
    return await Thread.countDocuments({ author: this._id });
}

userSchema.methods.getThanksReceived = async function() {
    return await Thank.countDocuments({ user: this._id });
};

userSchema.methods.getThanksGiven = async function() {
    return await Thank.countDocuments({ author: this._id });
};

userSchema.methods.getTotalLevel = async function() {

    const data = await Highscore.findOne({ user: this._id });
    if (!data) return -1;

    let highscores = new Highscores(data);

    return highscores.getTotalLevel();

};

const User = mongoose.model('User', userSchema);

module.exports = User;