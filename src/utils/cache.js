const exists = require('fs.promises.exists');

const ITEM_DEFINITIONS_PATH = 'D:/workspace/github/cryogen-cache/unpacked/items/';
const NPC_DEFINITIONS_PATH = 'D:/workspace/github/cryogen-cache/unpacked/npcs/';

class Cache {

    static itemDefinitions = [];
    static npcDefinitions = [];

    static async getItemDefinitions(id) {
        if (Cache.itemDefinitions[id]) return Cache.itemDefinitions[id];
        let defs = Cache.loadDefinition(ITEM_DEFINITIONS_PATH, id);
        if (!defs) return null;
        Cache.itemDefinitions[id] = defs;
        return defs;
    }

    static async getNPCDefinitions(id) {
        if (Cache.npcDefinitions[id]) return Cache.npcDefinitions[id];
        let defs = Cache.loadDefinition(NPC_DEFINITIONS_PATH, id);
        if (!defs) return null;
        Cache.npcDefinitions[id] = defs;
        return defs;
    }

    static async loadDefinition(basePath, id) {
        let path = basePath + id + '.json';

        try {

            if (!await exists(path)) return null;
            let defs = require(path);
            if (!defs) return null;
            return defs;
        } catch (error) {
            console.error(error);
            return null;
        }
    }

}

module.exports = Cache;