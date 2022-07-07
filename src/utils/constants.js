const Permissions = require('../models/forums/Permissions');

module.exports = {

    REGULAR_USERGROUP: '62c5cf9d72e005b64b48835d',
    BANNED_USERGROUP: '62c5cf9d72e005b64b488359',
    CHATBOX_MUTED_USERGROUP: '62c5cf9d72e005b64b48835b',
    ADMIN_USERGROUP: '62c5cf9d72e005b64b488357',
    ANNOUNCEMENTS_SUBFORUM: '62c5cf9d72e005b64b488367',
    DEFAULT_PERMISSIONS: '62c5cf9d72e005b64b488361',
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