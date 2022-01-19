const express = require('express');
const router = express.Router();

const Subforum = require('../../models/forums/Subforum');
const Permissions = require('../../models/forums/Permissions');

const DEFAULT_PERMISSIONS = null;

(async() => {
    //TODO - link to the actual default permissions
})();

async function getSubforumChildren(parent = null, res, req) {
    try {
        if (parent != null) {
            parent = await Subforum.findById(parent);
            if (!parent) {
                res.status(404).send({ message: 'Parent subforum not found.' });
                return;
            }
        }
        let subforums = await Subforum.find({ parent })
            .sort({ priority: 1 })
            .fill('extraData')
            .fill('subforums');
        subforums = subforums.filter(subforum => {
            if (!subforum.permissions) return true;
            return subforum.permissions.checkCanSee(res.user);
        });
        res.status(200).send(subforums);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Error getting categories.' });
    }
}

router.get('/children/:id', async(req, res) => {
    let parentId = req.params.id;
    if (!parentId) {
        res.status(400).send({ message: 'No id provided.' });
        return;
    }
    getSubforumChildren(parentId, res, req);
});

router.get('/:id', async(req, res) => {
    let id = req.params.id;
    if (!id) {
        res.status(400).send({ message: 'No id provided.' });
        return;
    }
    let subforum = await Subforum.findById(id).fill('extraData');
    if (subforum.permissions && !subforum.permissions.checkCanSee(res.user)) {
        res.status(403).send({ message: 'You do not have permission to view this subforum.' });
        return;
    }
    res.status(200).send(subforum);
});

router.get('/', async(req, res) => {
    getSubforumChildren(null, res, req);
});

router.post('/', async(req, res) => {

    try {
        if (!res.loggedIn) {
            res.status(403).send({ message: 'You do not have permission to do this.' });
            return;
        }
        if (res.user.displayGroup.rights < 2) {
            res.status(403).send({ message: 'You do not have permission to do this.' });
            return;
        }
        let parent = null;
        if (req.body.parentId) {
            parent = await Subforum.findById(req.body.parentId);
            if (!parent) {
                res.status(400).send({ message: 'Parent subforum not found.' });
                return;
            }
        }

        let permissions = DEFAULT_PERMISSIONS;
        if (req.body.permissionsId) {
            permissions = await Permissions.findById(req.body.permissionsId);
            if (!permissions) {
                res.status(400).send({ message: 'Permissions not found.' });
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
        res.status(500).send({ message: err });
    }
});

module.exports = router;