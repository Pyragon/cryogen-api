const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let schema = new Schema({
    question: {
        type: String,
        required: true,
    },
    answers: {
        type: [String],
        required: true,
    },
    votes: {
        type: [Object],
        required: true,
    },
    threadId: {
        type: Schema.Types.ObjectId,
        required: false
    },
    allowVoteChange: {
        type: Boolean,
        required: false,
        default: true,
    },
    showResultsBeforeVote: {
        type: Boolean,
        required: false,
        default: true,
    }
}, { timestamps: true });

const model = mongoose.model('Poll', schema);

module.exports = model;