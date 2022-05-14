const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    matches: {
        type: [String],
        required: true,
    },
    replace: {
        type: String,
        required: true,
    },
    example: {
        type: String,
        required: true,
    }
}, { timestamps: true });

schema.plugin(require('mongoose-autopopulate'));

const model = mongoose.model('BBCode', schema);

module.exports = model;