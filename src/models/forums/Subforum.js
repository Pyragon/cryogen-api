const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let schema = new Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    parentId: {
        type: String,
        required: true,
    },
    isCategory: {
        type: Boolean,
        required: true,
    },
    permissionsId: {
        type: String,
        required: true,
    },
    priority: {
        type: Number,
        required: true,
    },
    link: {
        type: String,
        required: false,
    }
}, { timestamps: true });

const Subforum = mongoose.model('Subforum', schema);

module.exports = Subforum;