const mongoose = require('mongoose');

const User = require('../models/User');

let middleware = async(req, res, next) => {

    // get cookie from request
    let cookie = req.cookies.sessionId;
    if (!cookie) {
        res.loggedIn = false;
        next();
        return;
    }

    try {
        //get session from database
        let user = await User.findOne({ sessionId: cookie });
        if (!user) {
            res.loggedIn = false;
            next();
            return;
        }

        res.loggedIn = true;
        res.user = user;
    } catch (err) {
        console.error(err);
        res.loggedIn = false;
        next();
        return;
    }
    next();

};

module.exports = middleware;