const moment = require('moment');

let formatNameForProtocol = (name) => {
    return name.toLowerCase().replace(' ', '_');
};

let formatPlayerNameForDisplay = (name) => {
    //replace all characters that are not after a space with lowercase
    let formattedName = name.replace(/[^\s]/g, c => c.toLowerCase());
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

module.exports = { formatNameForProtocol, formatMessage, formatPlayerNameForDisplay, escapeHtml, formatDate, filter };