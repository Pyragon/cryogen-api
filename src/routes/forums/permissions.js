const express = require('express');
const router = express.Router();

const Permissions = require('../../models/forums/Permissions');

router.post('/', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ message: 'You must be logged in to create permissions.' });
        return;
    }

    //TODO - is superadmin or admin
    if (!res.user.displayGroup._id.equals('61d53bc06e69950afc61cc9b')) {
        res.status(401).send({ message: 'You must be an admin to create permissions.' });
        return;
    }

    let permissions = new Permissions({
        canSee: req.body.canSee,
        canReadThreads: req.body.canReadThreads,
        canReply: req.body.canReply,
        canCreateThreads: req.body.canCreateThreads,
        canModerate: req.body.canModerate,
        canCreatePolls: req.body.canCreatePolls
    });

    try {
        let savedPermissions = await permissions.save();
        res.status(201).json({ permissions: savedPermissions });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error creating permissions.' });
    }
});

module.exports = router;