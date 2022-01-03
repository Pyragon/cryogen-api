const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let schema = new Schema({
    author: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    }
}, { timestamps: true });

let ChatboxMessage = mongoose.model('ChatboxMessage', schema);

module.exports = ChatboxMessage;