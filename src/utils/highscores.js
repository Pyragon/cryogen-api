module.exports = class Highscores {

    constructor(data) {
        this.data = data;
    }

    getTotalLevel() {
        return this.data.totalLevel;
    }

};