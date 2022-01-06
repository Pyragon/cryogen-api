const mongoose = require('mongoose-fill');
const Schema = mongoose.Schema;

const User = require('../User');

let schema = new Schema({
    user: {
        type: User.schema,
        required: true,
    },
    activity: {
        type: String,
        required: true,
    }
}, { timestamps: true });

const model = mongoose.model('model', schema);

module.exports = model;