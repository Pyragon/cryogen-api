const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const User = require('../../models/User');

let schema = new Schema({
    author: {
        type: User.schema,
        required: true,
    },
    message: {
        type: String,
        required: true,
    }
}, { timestamps: true });

let ChatboxMessage = mongoose.model('ChatboxMessage', schema);

module.exports = ChatboxMessage;