const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let schema = new Schema({
    name: {
        type: String,
        required: true,
    },
    rights: {
        type: Number,
        required: false,
        default: 0
    },
    colour: {
        type: String,
        required: false,
    },
    imageBefore: {
        type: String,
        required: false,
    },
    imageAfter: {
        type: String,
        required: false,
    },
    title: {
        type: String,
        required: false,
    }
}, { timestamps: true });

const model = mongoose.model('Usergroup', schema);

module.exports = model;