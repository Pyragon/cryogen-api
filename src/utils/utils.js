const moment = require('moment');

let formatNameForProtocol = (name) => {
    return name.toLowerCase().replace(' ', '_');
};

let formatPlayerNameForDisplay = (name) => {
    //replace all characters that are not after a space with lowercase
    let formattedName = name.replace(/[^\s]/g, c => c.toLowerCase()).replace('_', ' ');
    formattedName = formattedName.charAt(0).toUpperCase() + formattedName.slice(1);
    return formattedName;
}

let formatMessage = (message) => {
    //Uppercase first letter and all letters after a period
    let formattedMessage = message.charAt(0).toUpperCase() + message.slice(1);
    formattedMessage = formattedMessage.replace(/\. ?[a-z]{1}/g, c => c.toUpperCase());
    return formattedMessage;
};

let formatDate = (date, format = 'MMMM Do, YYYY h:mm:ss a') => {
    return moment(date).format(format);
};

let formatUser = async(user, toJSON) => {
    let doc = toJSON ? user.toJSON() : user._doc;
    return {
        ...doc,
        postCount: await user.getPostCount(),
        threadsCreated: await user.getThreadsCreated(),
        thanksReceived: await user.getThanksReceived(),
        thanksGiven: await user.getThanksGiven(),
        totalLevel: await user.getTotalLevel(),
    };
};

let getLevelForXp = (skill, xp) => {
    let points = 0;
    let output = 0;
    for (let lvl = 1; lvl <= (skill == DUNGEONEERING ? 120 : 99); lvl++) {
        points += Math.floor(lvl + 300.0 * Math.pow(2.0, lvl / 7.0));
        output = Math.floor(points / 4);
        if ((output - 1) >= xp)
            return lvl;
    }
    return skill == DUNGEONEERING ? 120 : 99;
}

const matchHtmlRegExp = /['&<>]/

function escapeHtml(string) {
    var str = '' + string
    var match = matchHtmlRegExp.exec(str)

    if (!match) {
        return str
    }

    var escape
    var html = ''
    var index = 0
    var lastIndex = 0

    for (index = match.index; index < str.length; index++) {
        switch (str.charCodeAt(index)) {
            case 34: // "
                escape = '&quot;'
                break
            case 38: // &
                escape = '&amp;'
                break
            case 39: // '
                escape = '&#39;'
                break
            case 60: // <
                escape = '&lt;'
                break
            case 62: // >
                escape = '&gt;'
                break
            default:
                continue
        }

        if (lastIndex !== index) {
            html += str.substring(lastIndex, index)
        }

        lastIndex = index + 1
        html += escape
    }

    return lastIndex !== index ?
        html + str.substring(lastIndex, index) :
        html
}

async function filter(arr, callback) {
    const fail = Symbol()
    return (await Promise.all(arr.map(async item => (await callback(item)) ? item : fail))).filter(i => i !== fail)
}

let ATTACK = 0,
    DEFENCE = 1,
    STRENGTH = 2,
    HITPOINTS = 3,
    RANGE = 4,
    PRAYER = 5,
    MAGIC = 6,
    COOKING = 7,
    WOODCUTTING = 8,
    FLETCHING = 9,
    FISHING = 10,
    FIREMAKING = 11,
    CRAFTING = 12,
    SMITHING = 13,
    MINING = 14,
    HERBLORE = 15,
    AGILITY = 16,
    THIEVING = 17,
    SLAYER = 18,
    FARMING = 19,
    RUNECRAFTING = 20,
    HUNTER = 21,
    CONSTRUCTION = 22,
    SUMMONING = 23,
    DUNGEONEERING = 24;

module.exports = { formatNameForProtocol, formatMessage, formatPlayerNameForDisplay, getLevelForXp, escapeHtml, formatDate, filter, formatUser };