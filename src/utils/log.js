const Cache = require('../utils/cache');

const User = require('../models/User');

const ObjectId = require('mongoose').Types.ObjectId;

const idIsNPC = [
    'bob',
    'bob_death',
    'npc_drop',
    'shop',
];

const idIsItem = [
    'grand_exchange',
    'npc_drop',
    'pickup',
    'player_owned_shop',
    'shop',
];

const idIsUser = [
    'dicing',
    'duelling',
    'grand_exchange',
    'pickup',
    'player_owned_shop',
    'pvp',
    'trade'
];

module.exports = async function toRealValues(log) {
    log = {...log._doc };
    if (idIsNPC.includes(log.type))
        log.npc = await Cache.getNPCDefinitions(log.id);
    if (idIsItem.includes(log.type))
        log.extra.item.defs = await Cache.getItemDefinitions(log.extra.item.id);
    if (idIsUser.includes(log.type)) {
        try {
            if (!ObjectId.isValid(log.id)) {
                console.error('Invalid id: ' + log.id);
                return log;
            }
            let user = await User.findById(log.id);
            if (!user) {
                console.error('Unable to find user');
                return log;
            }

            log.user2 = user;
        } catch (error) {
            console.error(error);
        }
    }
    if (log.items)
        log.items = await Promise.all(log.items.map(async item => {
            let defs = await Cache.getItemDefinitions(item.id);
            return {...item, defs };
        }));

    if (log.items2)
        log.items2 = await Promise.all(log.items2.map(async item => {
            let defs = await Cache.getItemDefinitions(item.id);
            return {...item, defs };
        }));

    if (log.type === 'death') {
        if (log.extra.source.type === 'npc')
            log.extra.source.defs = await Cache.getNPCDefinitions(log.id);
        else if (log.extra.source.type === 'player') {
            try {
                if (!ObjectId.isValid(log.id)) {
                    console.error('Invalid id: ' + log.id);
                    return log;
                }
                let user = await User.findById(log.id);
                if (!user) {
                    console.error('Unable to find user');
                    return log;
                }

                log.extra.source.player = user;
            } catch (error) {
                console.error(error);
            }
        }
    }
    return log;
}