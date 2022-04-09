const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        autopopulate: true,
    },
    typeId: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    action: {
        type: String,
        required: true,
    }
}, {
    timestamps: true
});

schema.plugin(require('mongoose-autopopulate'));

let model = mongoose.model('ModerationLog', schema);
module.exports = model;