const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let schema = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        autopopulate: true,
    },
    recipient: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        autopopulate: true,
    },
    subject: {
        type: String,
        required: true,
    },
    body: {
        type: String,
        required: true,
    },
    readAt: {
        type: Date,
        required: false,
    },
    archived: {
        type: Boolean,
        required: false,
        default: false
    }
}, { timestamps: true });

schema.plugin(require('mongoose-autopopulate'));

const model = mongoose.model('InboxMessage', schema);

module.exports = model;