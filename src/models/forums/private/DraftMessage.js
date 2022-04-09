const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let schema = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        autopopulate: true,
    },
    recipients: {
        type: String,
        required: false,
        default: ''
    },
    subject: {
        type: String,
        required: false,
        default: ''
    },
    body: {
        type: String,
        required: false,
        default: ''
    }
}, { timestamps: true });

schema.plugin(require('mongoose-autopopulate'));

const model = mongoose.model('DraftMessage', schema);

module.exports = model;