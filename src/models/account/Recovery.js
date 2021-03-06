const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let schema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        autopopulate: true,
    },
    status: {
        required: false,
        type: String,
        enum: ['PENDING', 'APPROVED', 'DENIED'],
        default: 'PENDING',
    },
    ip: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: false,
    },
    emailKey: {
        type: String,
        required: false,
    },
    discord: {
        type: String,
        required: false,
    },
    discordKey: {
        type: String,
        required: false,
    },
    geoLocation: {
        type: String,
        required: false,
    },
    isp: {
        type: String,
        required: false,
    },
    additional: {
        type: String,
        required: false,
    },
    previousPasswords: {
        type: [Boolean],
        required: false,
    },
    recoveryQuestions: {
        type: [Boolean],
        required: false,
    },
    viewKey: {
        type: String,
        required: true,
    },
    recoveredPassword: {
        type: String,
        required: false,
    },
    comments: {
        type: [{ type: Schema.Types.ObjectId, ref: 'RecoveryComment' }],
        required: false,
        autopopulate: true,
    }
}, { timestamps: true });

schema.plugin(require('mongoose-autopopulate'));

let model = mongoose.model('Recovery', schema);

module.exports = model;