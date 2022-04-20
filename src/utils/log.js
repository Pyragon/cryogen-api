const Cache = require('../utils/cache');

const idIsNPC = [
    'bob',
    'bob_death'
];

const idIsItem = [

];

module.exports = async function toRealValues(log) {
    log = {...log._doc };
    if (idIsNPC.includes(log.type))
        log.npc = await Cache.getNPCDefinitions(log.id);
    else if (idIsItem.includes(log.type))
        log.item = await Cache.getItemDefinitions(log.id);

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
    return log;
}