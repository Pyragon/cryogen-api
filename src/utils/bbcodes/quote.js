const Post = require('../../models/forums/Post');
const ObjectId = require('mongoose').Types.ObjectId;

const { formatDate } = require('../utils');

let regexp = '\\[quotes=#?([a-z0-9]+)\\]';

let format = async(content, viewer, post) => {
    let reg = new RegExp(regexp, 'gi');

    while (true) {
        let match = reg.exec(content);
        if (!match) break;

        let postId = match[1];
        if (!ObjectId.isValid(postId)) {
            content = content.replace(reg, createQuoteErrorElement('Invalid post ID'));
            continue;
        }

        let quotePost = await Post.findById(postId);
        if (quotePost._id.equals(post._id)) {
            content = content.replace(reg, createQuoteErrorElement('You cannot quote your own post'));
            continue;
        }
        if (!quotePost) {
            content = content.replace(reg, createQuoteErrorElement('Post not found'));
            continue;
        }

        content = content.replace(reg, createQuoteElement(quotePost));
    }
    return content;

};

function createQuoteElement(post) {
    return `<div class="quote">
                <div class="quote-header">
                    Quote by
                </div>
                <div class="quote-content">${post.content}</div>
            </div>`;
}

function createQuoteErrorElement(message) {
    return `<div class="quote">
                <div class="quote-header">
                    <div class="quote-author">Error</div>
                    <div class="quote-date">${message}</div>
                </div>
            </div>`;
}

module.exports = { regexp, format };