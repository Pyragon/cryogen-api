const express = require('express');
const router = express.Router();

const Usergroup = require('../../models/forums/Usergroup');

router.post('/', async(req, res) => {

    if (!res.loggedIn) {
        res.status(401).send({ message: 'You must be logged in to create a usergroup.' });
        return;
    }

    if (res.user.displayGroup.rights < 2) {
        res.status(403).send({ message: 'You do not have permission to do this.' });
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

        let savedUsergroup = await usergroup.save();
        res.status(200).send(savedUsergroup);

    } catch (err) {
        console.error(err);
        res.status(500).send({ message: err });
    }
});

module.exports = router;