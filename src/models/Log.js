const mongoose = require('mongoose-fill');
const Schema = mongoose.Schema;

let schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        autopopulate: true,
    },
    type: {
        type: String,
        required: true,
    },
    ip: {
        type: String,
        required: true,
    },
    id: {
        type: String,
        required: false,
    },
    user2: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        autopopulate: true,
    },
    tile: {
        type: String,
        required: false,
    },
    items: {
        type: [Object],
        required: false,
    },
    items2: {
        type: [Object],
        required: false,
    },
    extra: {
        type: Object,
        required: false,
    }
}, { timestamps: true });

schema.plugin(require('mongoose-autopopulate'));

const model = mongoose.model('Log', schema);

module.exports = model;