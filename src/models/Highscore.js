const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        autopopulate: true,
    },
    totalLevel: {
        type: Number,
        required: true,
    },
    totalXP: {
        type: Number,
        required: true,
    },
    totalXPStamp: {
        type: Date,
        required: true,
    },
    xp: {
        type: Array,
        required: true,
    },
    timestamps: {
        type: Array,
        required: true,
    }
});

schema.plugin(require('mongoose-autopopulate'));

const Highscore = mongoose.model('Highscore', schema);

module.exports = Highscore;