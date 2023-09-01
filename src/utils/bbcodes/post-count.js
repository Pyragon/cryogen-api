let regexp = '\\[postcount=(\\d+)\\](.*)\\[/postcount\\]';

let format = async(formatted, viewer, post) => {
    let reg = new RegExp(regexp, 'gi');

    while (true) {
        let match = reg.exec(formatted);
        if (!match) break;

        let postCount = match[1];
        let postContent = match[2];

        if (!viewer || (await viewer.getPostCount() < postCount && !viewer._id.equals(post.author._id))) {
            formatted = formatted.replace(reg, `<span style="color: red;">This text is hidden. You require a post count of ${postCount} to view it.</span>`);
            continue;
        }

        formatted = formatted.replace(reg, postContent);

    }
    return formatted;
};

module.exports = { regexp, format };