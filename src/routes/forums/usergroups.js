const express = require('express');
const router = express.Router();

const Usergroup = require('../../models/forums/Usergroup');

router.get('/', async(req, res) => {
    if (!res.loggedIn || res.user.displayGroup.rights < 2) {
        res.status(403).send({ error: 'Insufficient permissions' });
        return;
    }

    try {
        let usergroups = await Usergroup.find();

        res.status(200).send({ usergroups });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error });
    }


});

router.get('/:page', async(req, res) => {
    if (!res.loggedIn || res.user.displayGroup.rights < 2) {
        res.status(403).send({ error: 'Insufficient permissions' });
        return;
    }

    let id = Number(req.params.page) || 1;

    try {

        let usergroups = await Usergroup.find()
            .sort({ createdAt: 1 })
            .skip((id - 1) * 10)
            .limit(10);

        let pageTotal = Math.ceil(await Usergroup.countDocuments() / 10);

        res.status(200).send({ usergroups, pageTotal });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error });
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
        res.status(200).send({ usergroup });

    } catch (err) {
        console.error(err);
        res.status(500).send({ error: err });
    }
});

router.delete('/:id', async(req, res) => {
    if (!res.loggedIn || res.user.displayGroup.rights < 2) {
        res.status(403).send({ error: 'Insufficient permissions' });
        return;
    }

    let id = req.params.id;

    try {

        await Usergroup.deleteOne({ _id: id });
        res.status(200).send();

    } catch (error) {
        console.error(error);
        res.status(500).send({ error });
    }
});

module.exports = router;