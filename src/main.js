const express = require('express');
const app = express();

const props = require('../data/props.json');

const userMiddleware = require('./utils/user-middleware');

const port = props.port || 8081;

app.listen(port, () => console.log(`Listening on ${port}`));

app.use(userMiddleware)