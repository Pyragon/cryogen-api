const express = require('express');
const router = express.Router();

const Usergroup = require('../../models/forums/Usergroup');

router.get('/', async(req, res) => {
    if (!res.loggedIn || res.user.displayGroup.rights < 2) {
        res.status(403).send({ error: 'Insufficient permissions' });
        return;
    }

    try {
        const usergroups = await Usergroup.find();

        res.status(200).send({ usergroups });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error });
    }


});

router.post('/', async(req, res) => {

    if (!res.loggedIn) {
        res.status(401).send({ error: 'You must be logged in to create a usergroup.' });
        return;
    }

    if (res.user.displayGroup.rights < 2) {
        res.status(403).send({ error: 'You do not have permission to do this.' });
        return;
    }

    let { name, rights, colour, imageBefore, imageAfter, title } = req.body;

    let usergroup = new Usergroup({
        name,
        rights,
        colour,
        imageBefore,
        imageAfter,
        title
    });

    try {

        await usergroup.save();
        res.status(200).send({ usergroups });

    } catch (err) {
        console.error(err);
        res.status(500).send({ error: err });
    }
});

module.exports = router;