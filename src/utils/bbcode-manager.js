const BBCode = require('../models/forums/BBCode');
const fs = require('fs');

const { escapeHtml } = require('./format');

class BBCodeManager {

    static codes;

    static {

        BBCodeManager.refresh = async() => {
            BBCodeManager.codes = await BBCode.find({});
            let bbcodes = fs.readdirSync('./src/utils/bbcodes');
            for (let i = 0; i < bbcodes.length; i++) {
                let bbcode = require('./bbcodes/' + bbcodes[i]);
                BBCodeManager.codes.push({ regexp: bbcode.regexp, format: bbcode.format });
            }
        };

        BBCodeManager.refresh();

        BBCodeManager.interval = setInterval(() => BBCodeManager.refresh(), 60000);
    }

    constructor(post) {
        this.content = escapeHtml(post.content);
        this.post = post;
    }

    async getFormattedPost(viewer) {
        let formatted = this.content;
        for (let code of BBCodeManager.codes) {
            if (code.regexp) {
                while (true) {
                    let regexp = new RegExp(code.regexp, 'gi');
                    if (!formatted.match(regexp)) break;

                    formatted = await code.format(formatted, viewer, this.post);
                }
                continue;
            }
            for (let match of code.matches) {
                while (true) {
                    let regexp = new RegExp(match, 'gi');
                    let matched;
                    if (!(matched = formatted.match(regexp)))
                        break;

                    formatted = formatted.replace(regexp, code.replace);
                }
            }
        }
        return formatted;
    }

}

module.exports = BBCodeManager;