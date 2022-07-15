const Permissions = require('../models/forums/Permissions');

module.exports = {

    REGULAR_USERGROUP: '62d1d5dc993fc6d2300373d0',
    BANNED_USERGROUP: '62d1d5dc993fc6d2300373cc',
    CHATBOX_MUTED_USERGROUP: '62d1d5dc993fc6d2300373ce',
    ADMIN_USERGROUP: '62d1d5dc993fc6d2300373ca',
    ANNOUNCEMENTS_SUBFORUM: '62d1d5dc993fc6d2300373dc',
    DEFAULT_PERMISSIONS: '62d1d5dc993fc6d2300373d6',
    createDefaultPermissions() {
        return new Permissions({
            name: 'Created Default Permissions',
            canSee: [-1],
            canReply: [-2],
            canEdit: [-3],
            canCreateThreads: [-2],
            canModerate: [this.ADMIN_USERGROUP],
            canCreatePolls: [-2],
        });
    }
};