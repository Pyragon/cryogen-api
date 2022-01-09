const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    username: {
        type: String,
        required: true,
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

const Highscore = mongoose.model('Highscore', schema);

module.exports = Highscore;