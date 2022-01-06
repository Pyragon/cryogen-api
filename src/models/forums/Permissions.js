const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let schema = new Schema({});

const model = mongoose.model('Permissions', schema);

module.exports = model;