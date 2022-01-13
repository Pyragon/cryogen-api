const mongoose = require('mongoose-fill');
const Schema = mongoose.Schema;

const User = require('../User');

let schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    activity: {
        type: String,
        required: true,
    }
}, { timestamps: true });

const model = mongoose.model('UserActivity', schema);

module.exports = model;