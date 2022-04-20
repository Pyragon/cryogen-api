const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        autopopulate: true,
    },
    sessionId: {
        type: String,
        required: true,
    },
    expires: {
        type: Date,
        required: true,
    }
}, { timestamps: true });

schema.plugin(require('mongoose-autopopulate'));

let model = mongoose.model('Session', schema);

module.exports = model;