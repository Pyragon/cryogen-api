const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const ObjectId = require('mongodb').ObjectId;
const { v4: uuidv4 } = require('uuid');
const { sendRecoveryEmail } = require('../../utils/email');
const { validate, validateUsername, validateEmail } = require('../../utils/validate');

const User = require('../../models/User');
const Recovery = require('../../models/account/Recovery');
const RecoveryQuestion = require('../../models/account/RecoveryQuestion');
const RecoveryComment = require('../../models/account/RecoveryComment');

router.get('/view/:viewKey', async(req, res) => {

    let viewKey = req.params.viewKey;

    try {

        let recovery = await Recovery.findOne({ viewKey });
        if (!recovery) {
            res.status(400).json({ error: 'Recovery not found' });
            return;
        }

        res.status(200).json({ status: recovery.status });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error });
    }

});

router.get('/view/staff/:id', async(req, res) => {
    if (!res.loggedIn || res.user.displayGroup.rights < 2) {
        res.status(401).json({ error: 'Insufficient permissions.' });
        return;
    }

    let id = req.params.id;

    try {

        let recovery = await Recovery.findOne({ viewKey: id });
        if (!recovery) {
            res.status(400).json({ error: 'Recovery not found' });
            return;
        }

        return { recovery }

    } catch (error) {
        console.error(error);
        res.status(500).json({ error });
    }
});

router.post('/', async(req, res) => {

    if (res.loggedIn) {
        res.status(401).send({ error: 'You cannot send an account recovery while logged in!' });
        return;
    }

    let username = req.body.username.toLowerCase().replaceAll(' ', '_');
    let email = req.body.email;
    let discord = req.body.discord;
    let geoLocation = req.body.geoLocation;
    let isp = req.body.isp;
    let additional = req.body.additional;
    let passwords = req.body.passwords;
    let questions = req.body.questions;
    let answers = req.body.answers;
    let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    let validateOptions = {
        username: validateUsername,
        email: {

        },
        discord: {
            type: 'string',
            name: 'Discord',
            required: false,
            regexp: /[a-zA-Z0-9_]{3,32}#[0-9]{4}/
        },
        geoLocation: {
            type: 'string',
            name: 'City/Country',
            required: false,
            min: 3,
            max: 100,
        },
        isp: {
            type: 'string',
            name: 'ISP',
            required: false,
            min: 3,
            max: 100,
        },
        additional: {
            type: 'string',
            name: 'Additional Information',
            required: false,
            min: 3,
            max: 500,
        },
        passwords: {
            type: ['string'],
            name: 'Previous Passwords',
            required: false,
            min: 8,
            max: 50,
            duplicates: {
                allowed: false,
                error: 'Please do not enter the same previous password twice',
            }
        }
    }

    let [validated, error] = validate(validateOptions, {
        username,
        email,
        discord,
        geoLocation,
        isp,
        additional,
        passwords,
    });

    if (!validated) {
        res.status(400).json({ error });
        return;
    }

    //we'll have to do the recovery question validation ourselves as it's custom

    try {

        let user = await User.findOne({ username });
        if (!user) {
            res.status(404).send({ error: 'User not found.' });
            return;
        }

        let emailKey;
        if (user.email && user.email.toLowerCase() === email.toLowerCase()) {
            emailKey = uuidv4();
            //send email
        }

        let discordKey;
        if (user.discord && user.discord.toLowerCase() === discord.toLowerCase()) {
            discordKey = uuidv4();
            //send discord message
        }

        let passwordResults = [];
        passLoop: for (let password of passwords) {
            if (!user.previousPasswords) {
                passwordResults.push(false);
                continue;
            }
            for (let previous of user.previousPasswords) {
                let result = await bcrypt.compare(password, previous);
                if (result) {
                    passwordResults.push(true);
                    continue passLoop;
                }
            }
            passwordResults.push(false);
        }

        let questionResults = [];
        questionLoop: for (let i = 0; i < 3; i++) {
            if (!user.recoveryQuestions) {
                questionResults.push(false);
                continue;
            }
            let question = questions[i];
            let answer = answers[i];
            if (!question) {
                questionResults.push(false);
                continue;
            }
            let questionResult = await RecoveryQuestion.findById(question);
            if (!questionResult) {
                questionResults.push(false);
                continue;
            }
            if (!answer) {
                questionResults.push(false);
                continue;
            }
            for (let userQuestion of user.recoveryQuestions) {
                if (!userQuestion)
                    continue;
                if (questionResult._id.equals(userQuestion.question)) {
                    if (answer.toLowerCase() === userQuestion.answer.toLowerCase()) {
                        questionResults.push(true);
                        continue questionLoop;
                    }
                    questionResults.push(false);
                    continue questionLoop;
                }
            }
            questionResults.push(false);
        }

        let viewKey = uuidv4();

        let recovery = new Recovery({
            user,
            ip,
            email,
            discord,
            geoLocation,
            emailKey,
            discordKey,
            isp,
            additional,
            previousPasswords: passwordResults,
            recoveryQuestions: questionResults,
            viewKey,
        });

        await recovery.save();

        res.status(200).send({ viewKey });


    } catch (error) {
        console.error(error);
        res.status(500).send({ error: error });
    }

});

router.post('/questions', async(req, res) => {
    if (!res.loggedIn) {
        res.status(401).send({ error: 'You must be logged in to add a recovery question.' });
        return;
    }
    if (res.user.displayGroup.rights < 2) {
        res.status(401).send({ error: 'You must be an administrator to add a recovery question.' });
        return;
    }

    let question = req.body.question;
    if (question.length < 5 || question.length > 100) {
        res.status(400).send({ error: 'The question must be between 5 and 100 characters.' });
        return;
    }

    try {

        let recovery = new RecoveryQuestion({
            question
        });

        await recovery.save();

        res.status(200).send({ recovery });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error adding recovery question.' });
    }
});

router.get('/questions', async(req, res) => {

    try {

        let questions = await RecoveryQuestion.find({});

        res.status(200).send({ questions });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error getting recovery questions.' });
    }
});

router.post('/:id/comment', async(req, res) => {
    if (!res.loggedIn || res.user.displayGroup.rights < 2) {
        res.status(401).send({ error: 'Insufficient permissions.' });
        return;
    }

    let id = req.params.id;
    let comment = req.body.comment;
    if (!ObjectId.isValid(id)) {
        res.status(400).send({ error: 'Invalid ID.' });
        return;
    }

    try {

        let recovery = await Recovery.findById(id);
        if (!recovery) {
            res.status(404).send({ error: 'Recovery not found.' });
            return;
        }

        let validateOptions = {
            comment: {
                type: 'string',
                name: 'Comment',
                required: true,
                min: 3,
                max: 500,
            }
        };

        let [validated, error] = validate(validateOptions, { comment });
        if (!validated) {
            res.status(400).send({ error });
            return;
        }

        let recoveryComment = new RecoveryComment({
            author: res.user,
            comment,
        });

        await recoveryComment.save();

        res.status(200).send({ comment: recoveryComment });

    } catch (error) {
        console.error(error);
        res.status(500).send({ error: 'Error adding comment.' });
    }
});

module.exports = router;