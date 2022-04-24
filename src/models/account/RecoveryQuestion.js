const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let schema = new Schema({
    question: {
        type: String,
        required: true,
    }
}, { timestamps: true });

schema.plugin(require('mongoose-autopopulate'));

let model = mongoose.model('RecoveryQuestion', schema);

module.exports = model;