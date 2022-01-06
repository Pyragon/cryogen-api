const UserActivity = require('../models/forums/UserActivity');

let setUserActivity = async(user, activity) => {
    try {
        let userActivity = await UserActivity.findOne({ user: user._id });
        if (!userActivity) {
            userActivity = new UserActivity({
                user,
                activity,
            });
        } else {
            userActivity.activity = activity;
        }
        await userActivity.save();
    } catch (err) {
        console.error(err);
    }
};

module.exports = { setUserActivity };