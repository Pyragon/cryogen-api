const express = require('express');
const router = express.Router();

const ObjectId = require('mongoose').Types.ObjectId;

const { validate } = require('../../utils/validate');

const BBCode = require('../../models/forums/BBCode');
const BBCodeManager = require('../../utils/bbcode-manager');

router.get('/:page', async(req, res) => {
    if (!res.loggedIn || res.user.displayGroup.rights < 2) {
        res.status(403).send({ error: 'Insufficient permissions' });
        return;
    }

    let page = Number(req.params.page) || 1;

    try {

        let bbcodes = await BBCode.find()
            .sort({ createdAt: 1 })
            .skip((page - 1) * 10)
            .limit(10);

        let pageTotal = Math.ceil(await BBCode.countDocuments() / 10);

        bbcodes = await Promise.all(bbcodes.map(async(bbcode) => {
            //mock a post
            let post = {
                content: bbcode.example,
                author: res.user
            };
            let manager = new BBCodeManager(post);
            return {
                ...bbcode._doc,
                formatted: await manager.getFormattedPost(res.user),
            }
        }));

        res.status(200).send({ codes: bbcodes, pageTotal });

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

    let name = req.body.name;
    let description = req.body.description;
    let matches = req.body.matches;
    let replace = req.body.replace;
    let example = req.body.example;

    try {

        let error = validate(validateOptions, { name, description, matches, replace, example });
        if (error) {
            res.status(400).send({ error });
            return;
        }

        let bbcode = await BBCode.findById(id);
        if (!bbcode) {
            res.status(404).send({ error: 'BBCode not found' });
            return;
        }

        bbcode.name = name;
        bbcode.description = description;
        bbcode.matches = matches;
        bbcode.replace = replace;
        bbcode.example = example;

        await bbcode.save();

        res.status(200).send({ bbcode });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error });
    }

});

router.post('/', async(req, res) => {
    if (!res.loggedIn || res.user.displayGroup.rights < 2) {
        res.status(403).send({ error: 'Insufficient permissions' });
        return;
    }

    let name = req.body.name;
    let description = req.body.description;
    let matches = req.body.matches;
    let replace = req.body.replace;
    let example = req.body.example;

    try {

        let error = validate(validateOptions, { name, description, matches, replace, example });
        if (error) {
            res.status(400).send({ error });
            return;
        }

        let bbcode = new BBCode({
            name,
            description,
            matches,
            replace,
            example,
        });

        await bbcode.save();

        res.status(200).send({ bbcode });

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
        res.status(400).send({ error: 'Invalid ID.' });
        return;
    }

    try {

        await BBCode.deleteOne({ _id: id });

        res.status(200).send();

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error deleting bbcode.' });
    }
});

router.post('/refresh', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ error: 'You must be logged in to refresh bbcodes.' });
        return;
    }
    if (res.user.displayGroup.rights < 2) {
        res.status(401).send({ error: 'You must be an administrator to refresh bbcodes.' });
        return;
    }

    try {

        BBCodeManager.refresh();
        res.status(200).send();

    } catch (error) {
        console.error(error);
        res.status(500).send({ error });
    }
});

const validateOptions = {
    name: {
        required: true,
        name: 'BBCode Name',
        min: 2,
        max: 20
    },
    description: {
        required: true,
        name: 'BBCode Description',
        min: 2,
        max: 100
    },
    matches: {
        type: ['string'],
        required: true,
        name: 'BBCode Matches',
        min: 1,
    },
    replace: {
        required: true,
        name: 'BBCode Replacement',
        min: 1,
    },
    example: {
        required: true,
        name: 'Example',
        min: 3,
        max: 100,
    }
};

module.exports = router;