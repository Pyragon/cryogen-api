const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Message = require('./Message');

let schema = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        autopopulate: true,
    },
    recipients: {
        type: [Schema.Types.ObjectId],
        ref: 'User',
        required: true,
        autopopulate: true,
    },
    subject: {
        type: String,
        required: true,
    },
    notifyUsersWarning: {
        type: [Schema.Types.ObjectId],
        ref: 'User',
        required: true,
        autopopulate: true,
    }
}, { timestamps: true });

schema.plugin(require('mongoose-autopopulate'));

schema.methods.getLastMessage = async function() {
    return await Message.findOne({ chain: this._id })
        .sort({ createdAt: -1 });
};

const model = mongoose.model('MessageChain', schema);

module.exports = model;