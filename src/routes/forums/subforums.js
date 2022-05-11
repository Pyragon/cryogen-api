const express = require('express');
const router = express.Router();
const ObjectId = require('mongoose').Types.ObjectId;

const Subforum = require('../../models/forums/Subforum');
const Permissions = require('../../models/forums/Permissions');
const Thread = require('../../models/forums/Thread');

const constants = require('../../utils/constants');

class _Subforum {

    static DEFAULT_PERMISSIONS;

}

(async() => {

    try {
        _Subforum.DEFAULT_PERMISSIONS = await Permissions.findById(constants['DEFAULT_PERMISSIONS']);
    } catch (error) {
        console.error(error);
        _Subforum.DEFAULT_PERMISSIONS = constants.createDefaultPermissions();
    }

})();

router.get('/:id', async(req, res) => {

    let id = req.params.id;

    if (!ObjectId.isValid(id)) {
        res.status(400).send({ error: 'Invalid id.' });
        return;
    }

    try {

        let subforum = await Subforum.findById(id)
            .fill('extraData');
        if (!subforum) {
            res.status(404).send({ error: 'Subforum not found.' });
            return;
        }
        if (subforum.permissions && !subforum.permissions.checkCanSee(res.user)) {
            res.status(403).send({ error: 'Subforum not found.' });
            return;
        }

        let subforums = await Subforum.find({ parent: id })
            .sort({ priority: 1 })
            .fill('extraData')
            .fill('subforums');

        subforums = subforums.filter(subforum => {
            if (!subforum.permissions) return true;
            return subforum.permissions.checkCanSee(res.user);
        });

        subforum = {
            ...subforum._doc,
            subforums
        }

        res.status(200).send({ subforum });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error getting subforum.' });
    }

});

router.get('/:id/:page', async(req, res) => {

    let id = req.params.id;
    let page = Number(req.params.page) || 1;

    if (!ObjectId.isValid(id)) {
        res.status(400).send({ error: 'Invalid id.' });
        return;
    }

    try {

        let subforum = await Subforum.findById(id)
            .fill('extraData')
            .fill('subforums');
        if (!subforum) {
            res.status(404).send({ error: 'Subforum not found.' });
            return;
        }
        if (subforum.permissions && !subforum.permissions.checkCanSee(res.user)) {
            res.status(403).send({ error: 'Subforum not found.' });
            return;
        }

        let threads = await Thread.find({ subforum: id, archived: false })
            .sort({ createdAt: -1 })
            .skip((page - 1) * 10)
            .limit(10)
            .fill('postCount')
            .fill('firstPost')
            .fill('lastPost');

        let pageTotal = Math.ceil(Thread.countDocuments({ subforum: id, archived: false }) / 10);

        res.status(200).send({ threads, subforum, pageTotal });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error getting subforum.' });
    }

});

router.get('/', async(req, res) => {

    try {

        let subforums = await Subforum.find({ parent: null })
            .sort({ priority: 1 })
            .fill('extraData')
            .fill('subforums');

        subforums = subforums.filter(subforum => {
            if (!subforum.permissions) return true;
            return subforum.permissions.checkCanSee(res.user);
        });

        res.status(200).send({ subforums });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error getting subforum.' });
    }
});

router.post('/', async(req, res) => {

    if (!res.loggedIn) {
        res.status(403).send({ error: 'You do not have permission to do this.' });
        return;
    }
    if (res.user.displayGroup.rights < 2) {
        res.status(403).send({ error: 'You do not have permission to do this.' });
        return;
    }

    try {
        let parent = null;
        if (req.body.parentId) {
            parent = await Subforum.findById(req.body.parentId);
            if (!parent) {
                res.status(400).send({ error: 'Parent subforum not found.' });
                return;
            }
        }

        let permissions = _Subforum.DEFAULT_PERMISSIONS;
        if (req.body.permissionsId) {
            permissions = await Permissions.findById(req.body.permissionsId);
            if (!permissions) {
                res.status(400).send({ error: 'Permissions not found.' });
                return;
            }
        }

        let newSubforum = new Subforum({
            name: req.body.name,
            description: req.body.description,
            isCategory: req.body.isCategory || false,
            priority: req.body.priority || 1,
            link: req.body.link || null,
            parent,
            permissions,
        });
        let subforum = await newSubforum.save();
        res.status(200).send(subforum);
    } catch (err) {
        console.error(err);
        res.status(500).send({ error: err });
    }
});

router.get('/:id/threads/:page', async(req, res) => {

    let id = req.params.id;
    let page = Number(req.params.page) || 1;

    if (!ObjectId.isValid(id)) {
        res.status(400).send({ error: 'Invalid id.' });
        return;
    }

    try {

        let subforum = await Subforum.findById(id)
            .fill('extraData');
        if (!subforum) {
            res.status(404).send({ error: 'Subforum not found.' });
            return;
        }
        if (subforum.permissions && !subforum.permissions.checkCanSee(res.user)) {
            res.status(403).send({ error: 'Subforum not found.' });
            return;
        }

        let threads = await Thread.find({ subforum: id, archived: false })
            .sort({ createdAt: -1 })
            .skip((page - 1) * 10)
            .limit(10)
            .fill('postCount')
            .fill('firstPost')
            .fill('lastPost');

        res.status(200).send({ threads });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error loading subforum threads.' });
    }
});

module.exports = router;