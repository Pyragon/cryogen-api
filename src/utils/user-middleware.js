const mongoose = require('mongoose');

const User = require('../models/User');
const Session = require('../models/Session');

let middleware = async(req, res, next) => {

    let sessionId = req.get('Authorization');

    if (!sessionId) {
        res.loggedIn = false;
        next();
        return;
    }

    try {
        //get session from database
        let session = await Session.findOne({ sessionId });
        if (!session) {
            res.loggedIn = false;
            next();
            return;
        }

        let user = session.user;

        if (!user) {
            res.loggedIn = false;
            next();
            return;
        }
        res.loggedIn = true;
        res.user = user;
        res.sessionId = sessionId;
    } catch (err) {
        console.error(err);
        res.loggedIn = false;
        next();
        return;
    }
    next();

};

module.exports = middleware;