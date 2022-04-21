const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = Schema({
    thread: {
        type: Schema.Types.ObjectId,
        ref: 'Thread',
        required: true,
        autopopulate: true,
    },
    ip: {
        type: String,
        required: true,
    },
    expiry: {
        type: Date,
        required: true,
    }
}, { timestamps: true });

schema.plugin(require('mongoose-autopopulate'));

const model = mongoose.model('ThreadView', schema);

module.exports = model;