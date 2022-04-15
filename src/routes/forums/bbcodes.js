const express = require('express');
const router = express.Router();

const BBCode = require('../../models/forums/BBCode');
const BBCodeManager = require('../../utils/bbcode-manager');

router.post('/', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ error: 'You must be logged in to add a bbcode.' });
        return;
    }

    let name = req.body.name;
    let description = req.body.description;
    let matches = req.body.matches;
    let replace = req.body.replace;

    try {

        if (!name || !description || !matches || !replace) {
            res.status(400).send({ error: 'All fields must be filled out.' });
            return;
        }

        let bbcode = new BBCode({
            name,
            description,
            matches,
            replace,
        });

        let savedBbcode = await bbcode.save();

        res.status(200).send({ bbcode: savedBbcode });

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

    BBCodeManager.refresh();

    res.status(200).send({ message: "BBCodes successfully refreshed." });
});

module.exports = router;