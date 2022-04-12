const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Thanks = require('../Thank');

let schema = new Schema({
    chain: {
        type: Schema.Types.ObjectId,
        ref: 'MessageChain',
        required: false,
        autopopulate: true,
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        autopopulate: true,
    },
    recipients: {
        type: [Schema.Types.ObjectId],
        ref: 'User',
        required: false,
        autopopulate: true,
    },
    subject: {
        type: String,
        required: false,
    },
    content: {
        type: String,
        required: false,
    }
}, { timestamps: true });

schema.plugin(require('mongoose-autopopulate'));

schema.methods.getThanks = async function() {
    return await Thanks.find({ post: this._id });
};

const model = mongoose.model('Message', schema);

module.exports = model;