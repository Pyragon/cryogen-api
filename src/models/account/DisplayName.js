const mongoose = require('mongoose-fill');
const Schema = mongoose.Schema;

let schema = new Schema({
    name: {
        type: String,
        required: true,
    },
    previous: {
        type: String,
        required: false,
    },
    delay: {
        type: Date,
        required: false,
    }
}, {
    timestamps: true
});

schema.plugin(require('mongoose-autopopulate'));

let model = mongoose.model('DisplayName', schema);

module.exports = model;