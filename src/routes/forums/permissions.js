const express = require('express');
const router = express.Router();

const constants = require('../../utils/constants');

const Permissions = require('../../models/forums/Permissions');

router.post('/', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ error: 'You must be logged in to create permissions.' });
        return;
    }

    if (!res.user.displayGroup._id.equals(constants['ADMIN_USERGROUP'])) {
        res.status(401).send({ error: 'You must be an admin to create permissions.' });
        return;
    }

    //could use validate, but not sure that's really even worth it. Even after validating, this could easily screw up if the admin is trying to do fucky things.

    let permissions = new Permissions({
        canSee: req.body.canSee,
        canReadThreads: req.body.canReadThreads,
        canReply: req.body.canReply,
        canCreateThreads: req.body.canCreateThreads,
        canModerate: req.body.canModerate,
        canCreatePolls: req.body.canCreatePolls
    });

    try {

        await permissions.save();
        res.status(201).json({ permissions });

    } catch (err) {
        console.error(err);
        res.status(500).send({ error: 'Error creating permissions.' });
    }
});

module.exports = router;