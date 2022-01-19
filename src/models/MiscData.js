const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let schema = new Schema({
    name: {
        type: String,
        required: true,
    },
    value: {
        type: String,
        required: true,
    }
});

const MiscData = mongoose.model('MiscData', schema);

module.exports = MiscData;