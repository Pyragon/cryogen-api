const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let schema = new Schema({
    post: {
        type: Schema.Types.ObjectId,
        required: true,
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        autopopulate: true,
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        autopopulate: true,
    }
});

schema.plugin(require('mongoose-autopopulate'));

module.exports = mongoose.model('Thank', schema);