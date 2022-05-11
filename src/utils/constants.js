const Permissions = require('../models/forums/Permissions');

module.exports = {
    BANNED_USERGROUP: '61da915e0e77bd360dbb4dc2',
    CHATBOX_MUTED_USERGROUP: '61e7863d2fcb27a6a9744d54',
    REGULAR_USERGROUP: '61d53c02db49b2e1749bb34a',
    ADMIN_USERGROUP: '61d53bc06e69950afc61cc9b',
    DEFAULT_PERMISSIONS: '61dfb50b7965a7abf4d992ea',
    createDefaultPermissions() {
        return new Permissions({
            canSee: [-1],
            canReply: [-2],
            canEdit: [-3],
            canCreateThreads: [-2],
            canModerate: [this.ADMIN_USERGROUP],
            canCreatePolls: [-2],
        });
    }
};