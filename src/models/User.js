const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String,
        require: true
    },
    hash: {
        type: String,
        require: true
    },
    salt: {
        type: String,
        require: true
    },
    rights: {
        type: Number,
        require: false,
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
    creationIP: {
        type: String,
        required: true
    },
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;