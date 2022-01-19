const mongoose = require('mongoose-fill');
const Schema = mongoose.Schema;

let schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        autopopulate: true,
    },
    activity: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    id: {
        type: String,
        required: false
    }
}, { timestamps: true });

schema.plugin(require('mongoose-autopopulate'));

const model = mongoose.model('UserActivity', schema);

module.exports = model;