const BBCodeManager = require('./bbcode-manager');

async function mapPost(post, user) {

    try {

        let bbcodeManager = new BBCodeManager(post);

        return {
            ...post._doc,
            formatted: await bbcodeManager.getFormattedPost(user),
        }

    } catch (error) {
        console.error(error);
        return {
            ...post._doc,
            formatted: post.content,
        };
    }
};

async function mapPostWithValues(post, user) {

    try {

        let bbcodeManager = new BBCodeManager(post);

        return {
            ...post._doc,
            formatted: await bbcodeManager.getFormattedPost(user),
            postCount: await user.getPostCount(),
            thanksReceived: await user.getThanksReceived(),
            thanksGiven: await user.getThanksGiven(),
            thanks: await post.getThanks(),
            totalLevel: await user.getTotalLevel(),
        };

    } catch (error) {
        console.error(error);
        return {
            ...post._doc,
            formatted: post.content,
        }
    }

}

async function mapPostsWithValues(posts, user) {

    try {

        let counts = [],
            received = [],
            given = [],
            levels = [];

        posts = await Promise.all(posts.map(async(post) => {

            let bbcodeManager = new BBCodeManager(post);

            if (!counts[post.author.username])
                counts[post.author.username] = await post.author.getPostCount();
            if (!received[post.author.username])
                received[post.author.username] = await post.author.getThanksReceived();
            if (!given[post.author.username])
                given[post.author.username] = await post.author.getThanksGiven();
            if (!levels[post.author.username])
                levels[post.author.username] = await post.author.getTotalLevel();

            return {
                ...post._doc,
                formatted: await bbcodeManager.getFormattedPost(user),
                postCount: counts[post.author.username],
                thanksReceived: received[post.author.username],
                thanksGiven: given[post.author.username],
                thanks: await post.getThanks(),
                totalLevel: levels[post.author.username],
            };


        }));

    } catch (error) {
        console.error(error);
        return posts.map(post => ({
            ...post._doc,
            formatted: post.content,
            postCount: 1,
            thanksReceived: 0,
            thanksGiven: 0,
            thanks: 0,
            totalLevel: 1,
        }));
    }

}

module.exports = { mapPost, mapPostWithValues, mapPostsWithValues };