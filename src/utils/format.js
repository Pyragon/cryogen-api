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

module.exports = { formatNameForProtocol, formatMessage, formatPlayerNameForDisplay };