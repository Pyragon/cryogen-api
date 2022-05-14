const Permissions = require('../models/forums/Permissions');

module.exports = {
    ANNOUNCEMENTS_SUBFORUM: '627c6c80a6a1a4b961a39d01',
    BANNED_USERGROUP: '627d6151bfceaef7c5871acc',
    CHATBOX_MUTED_USERGROUP: '627d615f19fb5fddff7d50ee',
    REGULAR_USERGROUP: '627d616bd486d5d754f0f7ec',
    ADMIN_USERGROUP: '627d617e422bd9a21e842078',
    DEFAULT_PERMISSIONS: '627c6c00802f439500e295c0',
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