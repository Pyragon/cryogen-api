const express = require('express');
const router = express.Router();

const Log = require('../models/Log');
const toRealValues = require('../utils/log');

router.get('/:page', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ error: 'You must be logged in to view the logs.' });
        return;
    }
    if (res.user.displayGroup.rights < 2) {
        res.status(401).send({ error: 'You must be an administrator to view the logs.' });
        return;
    }

    let page = req.params.page;
    let type = req.query.type;
    let filters = req.query.filters || {};

    try {

        let logs = await Log.find({ type, ...filters })
            .sort({ createdAt: -1 })
            .skip((page - 1) * 10)
            .limit(10);

        logs = await Promise.all(logs.map(async(log) => await toRealValues(log)))

        let pageTotal = Math.ceil(await Log.countDocuments({ type, ...filters }) / 10);

        res.status(200).send({ logs, pageTotal });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error });
    }
});

router.get('/', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ error: 'You must be logged in to view the logs.' });
        return;
    }
    if (res.user.displayGroup.rights < 2) {
        res.status(401).send({ error: 'You must be an administrator to view the logs.' });
        return;
    }

    let id = req.body.id;

    try {

        let log = await Log.findById(id);

        res.status(200).send({ log });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error });
    }
});

const acceptedTypes = [
    'bob',
    'bob_death',
    'chat',
    'command',
    'death',
    'dicing',
    'drop',
    'duelling',
    'grand_exchange',
    'login',
    'npc_drop',
    'pickup',
    'player_owned_shop',
    'pvp',
    'shop',
    'trade'
];

router.post('/', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ error: 'You must be logged in to add a log.' });
        return;
    }
    if (res.user.displayGroup.rights < 2) {
        res.status(401).send({ error: 'You must be an administrator to add a log.' });
        return;
    }

    let type = req.body.type;
    if (!type) {
        res.status(400).send({ error: 'You must specify a type.' });
        return;
    }
    if (!acceptedTypes.includes(type)) {
        res.status(400).send({ error: 'The specified type is not valid.' });
        return;
    }

    let id = req.body.id;
    let ip = req.body.ip;
    let user2 = req.body.user2;
    let tile = req.body.tile;
    let items = req.body.items;
    let items2 = req.body.items2;
    let extra = req.body.extra;

    try {

        let log = new Log({
            user: res.user._id,
            type,
            ip,
            id,
            user2,
            tile,
            items,
            items2,
            extra,
        });

        await log.save();

        res.status(200).send({ log });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error });
    }

});

module.exports = router;