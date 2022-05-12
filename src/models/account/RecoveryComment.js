const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let schema = new Schema({
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        autopopulate: true,
    },
    comment: {
        type: String,
        required: true,
    }
}, { timestamps: true });

schema.plugin(require('mongoose-autopopulate'));

let model = mongoose.model('RecoveryComment', schema);

module.exports = model;