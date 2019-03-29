const v = require('./vector');

// vmin units
const MIN_SIZE = 2;
const MAX_SIZE = 5;

class Ball {
    constructor() {
        this.bounce = 0.7;
        this.active = false;

        this.position = new v.Vector();
        this.velocity = new v.Vector();

        this.init();
    }

    setSize(s) {
        this.size = s;
        this.mass = s * s;
    }

    init() {
        this.color = Math.random() * 5 | 0;
        this.size = Math.random() * (MAX_SIZE - MIN_SIZE);
        this.mass = this.size * this.size;
    }
}

module.exports = Ball;