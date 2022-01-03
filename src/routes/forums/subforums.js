const express = require('express');
const router = express.Router();

const Subforum = require('../../models/forums/Subforum');

router.get('/', async(req, res) => {
    let parentId = req.query.parentId;
    if (parentId === undefined)
        parentId = -1;
    try {
        let subforums = await Subforum.find({ parentId: parentId }).sort({ priority: 1 });
        res.status(200).send(subforums);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error getting categories.' });
    }
});

router.post('/', async(req, res) => {
    console.log(req.body);
    let newSubforum = new Subforum({
        name: req.body.name,
        description: req.body.description,
        parentId: req.body.parentId,
        isCategory: req.body.isCategory,
        permissionsId: req.body.permissionsId,
        priority: req.body.priority,
        link: req.body.link
    });
    try {
        let subforum = await newSubforum.save();
        res.status(200).send(subforum);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: err });
    }
});

module.exports = router;