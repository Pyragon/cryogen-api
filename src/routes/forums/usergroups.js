const express = require('express');
const router = express.Router();
const { validate } = require('../../utils/validate');
const constants = require('../../utils/constants');

const ObjectId = require('mongoose').Types.ObjectId;

const Usergroup = require('../../models/forums/Usergroup');

router.get('/', async(req, res) => {
    if (!res.loggedIn || res.user.displayGroup.rights < 2) {
        res.status(403).send({ error: 'Insufficient permissions' });
        return;
    }

    try {
        let usergroups = await Usergroup.find();

        res.status(200).send({ usergroups, defaultGroup: constants['REGULAR_USERGROUP'] });

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

    let page = Number(req.params.page) || 1;

    try {

        let usergroups = await Usergroup.find()
            .sort({ createdAt: 1 })
            .skip((page - 1) * 10)
            .limit(10);

        let pageTotal = Math.ceil(await Usergroup.countDocuments() / 10);

        res.status(200).send({ usergroups, pageTotal });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error });
    }
});

router.put('/:id', async(req, res) => {
    if (!res.loggedIn || res.user.displayGroup.rights < 2) {
        res.status(403).send({ error: 'Insufficient permissions' });
        return;
    }

    let id = req.params.id;
    if (!ObjectId.isValid(id)) {
        res.status(400).send({ error: 'Invalid ID' });
        return;
    }

    let { name, rights, colour, htmlBefore, htmlAfter, title } = req.body;

    let error = validate(validateOptions, { name, rights, colour, htmlBefore, htmlAfter, title });
    if (error) {
        res.status(400).send({ error });
        return;
    }

    try {

        let usergroup = await Usergroup.findById(id);

        if (!usergroup) {
            res.status(404).send({ error: 'Usergroup not found' });
            return;
        }

        usergroup.name = name;
        usergroup.rights = rights;
        usergroup.colour = colour;
        usergroup.htmlBefore = htmlBefore;
        usergroup.htmlAfter = htmlAfter;
        usergroup.title = title;

        await usergroup.save();

        res.status(200).send({ usergroup });


    } catch (error) {
        console.error(error);
        res.status(500).send({ error });
    }
});

router.post('/', async(req, res) => {

    // if (!res.loggedIn) {
    //     res.status(401).send({ error: 'You must be logged in to create a usergroup.' });
    //     return;
    // }

    // if (res.user.displayGroup.rights < 2) {
    //     res.status(403).send({ error: 'You do not have permission to do this.' });
    //     return;
    // }

    let { name, rights, colour, htmlBefore, htmlAfter, title } = req.body;

    let error = validate(validateOptions, { name, rights, colour, htmlBefore, htmlAfter, title });
    if (error) {
        res.status(400).send({ error });
        return;
    }

    try {

        let usergroup = new Usergroup({
            name,
            rights,
            colour,
            htmlBefore,
            htmlAfter,
            title
        });

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
    if (!ObjectId.isValid(id)) {
        res.status(400).send({ error: 'Invalid ID' });
        return;
    }

    try {

        await Usergroup.deleteOne({ _id: id });
        res.status(200).send();

    } catch (error) {
        console.error(error);
        res.status(500).send({ error });
    }
});

let validateOptions = {
    name: {
        required: true,
        type: 'string',
        name: 'Name',
        min: 1,
        max: 50,
    },
    rights: {
        required: true,
        type: 'number',
        name: 'Rights',
    },
    colour: {
        required: false,
        type: 'string',
        name: 'Colour',
        min: 7,
        max: 7,
    },
    title: {
        required: false,
        type: 'string',
        name: 'Title',
        min: 1,
        max: 50,
    },
    htmlBefore: {
        required: false,
        type: 'string',
        name: 'Image before',
        min: 1,
        max: 200,
    },
    htmlAfter: {
        required: false,
        type: 'string',
        name: 'Image after',
        min: 1,
        max: 200,
    }
};

module.exports = router;