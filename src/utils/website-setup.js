//should setup everything needed to run the website

//create admin user
//create usergroups (owner, admin, banned, chatbox muted, regular)
//create default permissions
//create permissions for announcements

//create cryogen->announcements forum and subforum

//should even setup the default bbcodes if wanted
//have prompts asking for all of this

const mongoose = require('mongoose');
const rl = require('readline-sync');
const bcrypt = require('bcrypt');

const props = require('../../data/props.json');
const constants = require('./constants');
const { formatPlayerNameForDisplay } = require('./utils');
const { validate, validateUsername, validatePassword, validateEmail } = require('./validate');

const User = require('../models/User');
const Usergroup = require('../models/forums/Usergroup');
const Permissions = require('../models/forums/Permissions');
const Subforum = require('../models/forums/Subforum');

async function setup() {

    mongoose.connect(props.connectionString, { useNewUrlParser: true });

    let username = rl.question('What would you like to name your admin account? ');
    let email = rl.question('What is the email of this admin account? ');

    let password = rl.question('What would you like to set your admin account password to? ', {
        hideEchoBack: true
    });
    let passwordCheck = rl.question('Please retype your password to confirm: ', {
        hideEchoBack: true
    });
    if (password !== passwordCheck) {
        console.log('Passwords do not match');
        process.exit(1);
    }
    let error = validate({
        email: {
            ...validateEmail,
            required: true,
        },
        username: validateUsername,
        password: validatePassword,
    }, { username, email, password });
    if (error) {
        console.log(error);
        process.exit(1);
    }

    let hash = await bcrypt.hash(password, 10);
    let displayName = formatPlayerNameForDisplay(username);

    let baseUrl = rl.question('What is the base url of your website? Leave blank for http://localhost:3000 ');
    baseUrl = baseUrl || 'http://localhost:3000';
    if (baseUrl.endsWith('/'))
        baseUrl = baseUrl.slice(0, -1);


    let user = await User.findOne({ username });
    if (user) {
        console.log('User already exists. Please make sure this script is only run from a new install.');
        process.exit(1);
    }

    //create all the usergroups
    console.log('Creating usergroups...');
    let groups = {};
    for (let group of USERGROUPS) {
        let data = {
            name: group.name,
            rights: group.rights,
        };
        if (group.title)
            data.title = group.title;
        if (group.colour)
            data.colour = group.colour;
        if (group.imageBefore)
            data.imageBefore = group.imageBefore;
        if (group.imageAfter)
            data.imageAfter = group.imageAfter;
        let saved = await Usergroup.create(data);
        groups[group.name.toLowerCase()] = saved._id;
    }

    //creating admin user with owner and admin usergroups
    console.log('Creating admin user...');
    let adminUser = await User.create({
        username,
        displayName,
        hash,
        email,
        creationIp: '127.0.0.1',
        displayGroup: groups['owner']._id,
        usergroups: [groups['admin']._id, groups['regular user']._id],
    });
    console.log('Created admin user', adminUser);

    //create default permissions
    console.log('Creating default permissions...');
    let defaultPermissions = await Permissions.create({
        name: 'Default Permissions',
        canSee: [-1],
        canReply: [-2],
        canEdit: [-3],
        canCreateThreads: [-2],
        canModerate: [groups['admin']._id],
        canCreatePolls: [-2],
    });
    console.log('Created default permissions', defaultPermissions);

    //create permissions for announcements
    console.log('Creating permissions for announcements...');
    let announcementsPermissions = await Permissions.create({
        name: 'Announcements Permissions',
        canSee: [-1],
        canReply: [-2],
        canEdit: [-3],
        canCreateThreads: [groups['admin']._id],
        canModerate: [groups['admin']._id],
        canCreatePolls: [groups['admin']._id],
    });
    console.log('Created permissions for announcements', announcementsPermissions);

    //create announcements forum and subforum
    console.log('Creating Cryogen category...');
    let cryogenCategory = await Subforum.create({
        name: 'Cryogen',
        description: 'The Cryogen category is for announcements and discussions about Cryogen.',
        parent: null,
        isCategory: true,
        permissions: announcementsPermissions._id,
        priority: 0,
    });
    console.log('Created Cryogen category', cryogenCategory);

    console.log('Creating announcements subforum...');
    let announcementsSubforum = await Subforum.create({
        name: 'Announcements',
        description: 'The announcements subforum is for announcements and discussions about Cryogen.',
        parent: cryogenCategory._id,
        isCategory: false,
        permissions: announcementsPermissions._id,
        priority: 0,
    });
    console.log('Created announcements subforum', announcementsSubforum);

    console.log('Replace these values in constants.js');
    console.log('REGULAR_USERGROUP: \'' + groups['regular user']._id + '\',');
    console.log('BANNED_USERGROUP: \'' + groups['banned']._id + '\',');
    console.log('CHATBOX_MUTED_USERGROUP: \'' + groups['chatbox muted']._id + '\',');
    console.log('ADMIN_USERGROUP: \'' + groups['admin']._id + '\',');

    console.log('ANNOUNCEMENTS_SUBFORUM: \'' + announcementsSubforum._id + '\',');
    console.log('DEFAULT_PERMISSIONS: \'' + defaultPermissions._id + '\',');

    process.exit();
}

setup();

const BBCODES = [

];

const USERGROUPS = [{
    name: 'Owner',
    rights: 2,
    title: 'Owner',
    colour: '#ff0000',
    imageBefore: '/images/crowns/owner.png',
    imageAfter: '',
}, {
    name: 'Admin',
    rights: 2,
    title: 'Administrator',
    colour: '#2E9AFE',
}, {
    name: 'Banned',
    rights: 0,
}, {
    name: 'Chatbox Muted',
    rights: 0,
}, {
    name: 'Regular User',
    rights: 0,
}];