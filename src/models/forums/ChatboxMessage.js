const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let schema = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        autopopulate: true,
    },
    message: {
        type: String,
        required: true,
    }
}, { timestamps: true });

schema.plugin(require('mongoose-autopopulate'));

let ChatboxMessage = mongoose.model('ChatboxMessage', schema);

module.exports = ChatboxMessage;