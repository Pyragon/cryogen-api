const express = require('express');
const router = express.Router();

const Usergroup = require('../../models/forums/Usergroup');

router.post('/', async(req, res) => {

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