const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const walk = require('walk');
const cors = require('cors');
const app = express();

const props = require('../data/props.json');

const User = require('./models/User');

const userMiddleware = require('./utils/user-middleware');
const cookieParser = require('cookie-parser');

const port = props.port || 8081;

mongoose.connect(props.connectionString, { useNewUrlParser: true })
    .then(() => app.listen(port, () => console.log(`Listening on port ${port}`)));

app.use(express.json());
app.use(cookieParser());
app.use(userMiddleware);
app.use(cors({
    origin: ['http://localhost:3000']
}))

let walker = walk.walk('./src/routes', { followLinks: false });

walker.on('file', function(root, stat, next) {
    if (stat.name.endsWith('.js')) {
        try {
            const route = require('./' + path.join(root, stat.name).replace('src\\', ''));
            let routePath = root.replace(/\.\/src\/routes/, '').replaceAll('\\', '/') + '/' + stat.name.replace('.js', '');
            app.use(routePath, route);
        } catch (err) {
            console.error(err);
        }
    }
    next();
});