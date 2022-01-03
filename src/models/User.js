const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    hash: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: false,
    },
    rights: {
        type: Number,
        required: false,
        default: 0
    },
    donator: {
        type: Number,
        required: false,
        default: 0
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
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;