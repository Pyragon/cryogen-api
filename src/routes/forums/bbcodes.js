const express = require('express');
const router = express.Router();

const { validate } = require('../../utils/validate');

const BBCode = require('../../models/forums/BBCode');
const BBCodeManager = require('../../utils/bbcode-manager');

router.post('/', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ error: 'You must be logged in to add a bbcode.' });
        return;
    }

    let validateOptions = {
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
        }
    };

    let name = req.body.name;
    let description = req.body.description;
    let matches = req.body.matches;
    let replace = req.body.replace;

    try {

        let [validated, error] = validate(validateOptions, { name, description, matches, replace });
        if (!validated) {
            res.status(400).send({ error });
            return;
        }

        let bbcode = new BBCode({
            name,
            description,
            matches,
            replace,
        });

        await bbcode.save();

        res.status(200).send({ bbcode });

    } catch (err) {
        console.error(err);
        res.status(500).send({ error: err });
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

module.exports = router;