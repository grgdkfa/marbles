
class Vector {
    constructor(x, y) {
        this.x = x || 0;
        this.y = y || 0;
    }

    set(x, y) {
        this.x = x;
        this.y = y;
    }

    length() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    sqrLength() {
        return this.x * this.x + this.y * this.y;
    }

    normalize() {
        let l = this.length();
        this.x /= l;
        this.y /= l;
    }

    scale(factor) {
        this.x *= factor;
        this.y *= factor;
    }

    addImpulse(impulse, factor) {
        this.x = this.x + impulse.x * factor;
        this.y = this.y + impulse.y * factor;
    }
}

function add(a, b) {
    return new Vector(a.x + b.x, a.y + b.y);
}

function adds(a, b, v) {
    v.x = a.x + b.x;
    v.y = a.y + b.y;
}

function scale(vector, factor) {
    return new Vector(vector.x * factor, vector.y * factor);
}

function combine(vector, gravity, factor) {
    vector.x += gravity.x * factor;
    vector.y += gravity.y * factor;
}

function sub(a, b) {
    return new Vector(a.x - b.x, a.y - b.y);
}

function subs(a, b, v) {
    v.x = a.x - b.x;
    v.y = a.y - b.y;
}

function dot(a, b) {
    return a.x * b.x + a.y * b.y;
}

module.exports = {
    Vector,
    add, adds,
    sub, subs,
    scale,
    combine,
    dot
}