const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ObjectId = mongoose.Types.ObjectId;

const Usergroup = require('./Usergroup');

let schema = new Schema({
    name: {
        type: String,
        required: false,
        default: 'Default Perm'
    },
    canSee: {
        type: [String],
        required: true,
    },
    canReply: {
        type: [String],
        required: true,
    },
    canEdit: {
        type: [String],
        required: true,
    },
    canCreateThreads: {
        type: [String],
        required: true,
    },
    canModerate: {
        type: [String],
        required: true,
    },
    canCreatePolls: {
        type: [String],
        required: true,
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true
    }
});

// -1 = anyone
// -2 = anyone logged in
// -3 = if you are author
// -4 = if a staff member is author (really only used for checkCanSee)

schema.fill('usergroups', async function(callback) {
    try {
        let groups = {};
        let toCheck = [this.canSee, this.canReply, this.canEdit, this.canCreateThreads, this.canModerate, this.canCreatePolls];
        for (let permissions of toCheck) {
            for (let id of permissions) {
                if (!ObjectId.isValid(id) || groups[id]) continue;

                let group = await Usergroup.findById(id);
                if (!group) {
                    console.error(`Invalid usergroup ${id} in permissions ${this._id}`);
                    continue;
                }

                groups[id] = group;

            }
        }

        callback(null, groups);
    } catch (error) {
        console.log(error);
        callback(null, {});
    }
});

schema.methods.checkCanSee = function(user, thread) {
    if (this.canSee.includes('-1')) return true;
    if (this.canSee.includes('-2') && user) return true;
    if (!user) return false;
    if (this.canSee.includes[user.displayGroup._id]) return true;
    //see if canSee includes any values from user.userGroup
    for (let i = 0; i < user.userGroups.length; i++)
        if (this.canSee.includes(user.userGroups[i])) return true;
    if (this.canSee.includes('-3') && user !== null && thread && thread.author._id === user._id) return true;
    if (this.canSee.includes('-4') && user !== null && thread && thread.author.displayGroup.rights > 0) return true;
    return false;
};

schema.methods.checkCanEdit = function(user, post) {
    if (!user || !post) return false;
    let data = this.canEdit;
    if (data.includes('-3') && post.author._id === user._id) return true;
    if (data.includes[user.displayGroup._id]) return true;
    for (let i = 0; i < user.userGroups.length; i++)
        if (data.includes(user.userGroups[i])) return true;
    return false;
};

schema.methods.checkCanCreateThreads = function(user) {
    if (!user) return false;
    let data = this.canCreateThreads;
    if (data.includes('-1') || data.includes('-2')) return true;
    for (let id of data)
        if (user.displayGroup._id.equals(id)) return true;
    if (user.userGroups)
        for (let i = 0; i < user.userGroups.length; i++)
            if (data.includes(user.userGroups[i])) return true;
    return false;
};

schema.methods.checkCanReply = function(user, thread) {
    if (!user) return false;
    let data = this.canReply;
    if (data.includes('-1') || data.includes('-2')) return true;
    for (let id of data)
        if (user.displayGroup._id.equals(id)) return true;
    if (user.userGroups)
        for (let i = 0; i < user.userGroups.length; i++)
            if (data.includes(user.userGroups[i])) return true;
    if (data.includes('-3') && thread.author._id === user._id) return true;
    return false;
};

schema.methods.checkCanModerate = function(user) {
    if (!user) return false;
    let data = this.canModerate;
    for (let id of data)
        if (user.displayGroup._id.equals(id)) return true;
    if (user.userGroups)
        for (let i = 0; i < user.usergroups.length; i++)
            if (data.includes(user.usergroups[i])) return true;
    return false;
}

const model = mongoose.model('Permissions', schema);

module.exports = model;