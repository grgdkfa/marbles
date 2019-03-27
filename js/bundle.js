(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const v = require('./vector');

// vmin units
const MIN_SIZE = 2;
const MAX_SIZE = 5;

class Ball {
    constructor() {
        this.bounce = 0.98;
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
},{"./vector":5}],2:[function(require,module,exports){

const Renderer = require('./renderer');
const World = require('./physics');

class Game {
	constructor() {
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.renderer = new Renderer('.game-canvas');
		this.world = new World(this.width, this.height, 10);

		this.renderer.resize(this.width, this.height);
		this.world.init();
	}

	frame() {
		for(let i=0; i<10; i++) {
			this.world.solve(0.01);
		}
		this.renderer.render(this.world.balls);
	}
}

const game = new Game();

game.frame();

setInterval(function() {
	game.frame();
}, 30);
},{"./physics":3,"./renderer":4}],3:[function(require,module,exports){

const v = require('./vector');
const Ball = require('./ball');

class World {
    constructor(width, height, count) {
        this.width = width;
        this.height = height;
        this.gravity = new v.Vector(0, 10);
        this.setCount(count);
    }

    setCount(count) {
        count = count || 0;
        this.balls = new Array(count);
        for(let i = 0; i < count; i++) {
            this.balls[i] = new Ball();
        }
    }

    init() {
        const maxSize = this.width * 0.09;
        const minSize = this.width * 0.02;
        for(let i=0; i<this.balls.length; i++) {
            const a = this.balls[i];
            a.position.x = Math.random() * this.width;
            a.position.y = Math.random() * this.height;

            a.setSize((minSize + Math.random() * (maxSize - minSize)) / 2);

            a.velocity.x = Math.random() - 0.5;
            a.velocity.y = Math.random() - 0.5;
            a.velocity.scale(50);

            a.active = true;
        }
        /*const a = new Ball();
        a.position.set(100, 100);
        a.velocity.set(50, 0);
        a.size = 50;
        a.mass = 5;
        a.active = true;
        this.balls[0] = a;

        const b = new Ball();
        b.position.set(200, 100);
        b.velocity.set(-20, 0);
        b.size = 50;
        b.mass = 1;
        b.active = true;
        this.balls[1] = b;*/
    }

    solve(dt) {
        const g = v.scale(this.gravity, dt);

        for(let i=0; i<this.balls.length; i++) {
            const a = this.balls[i];
            if(!a.active) {
                continue;
            }
            v.adds(a.velocity, g, a.velocity);
            v.combine(a.position, a.velocity, dt);
        }

        const normal = new v.Vector();
        const tangent = new v.Vector();

        for(let i=0; i<this.balls.length - 1; i++) {
            const a = this.balls[i];
            if(!a.active) {
                continue;
            }
            for(let j=i+1; j<this.balls.length; j++) {
                const b = this.balls[j];
                if(!b.active) {
                    continue;
                }

                v.subs(a.position, b.position, normal);
                if(normal.sqrLength() < Math.pow(a.size + b.size, 2)) {
                    let normalLength = normal.length();
                    normal.scale(1 / normalLength);
                    tangent.set(-normal.y, normal.x);
                    normalLength -= a.size + b.size;

                    v.combine(a.position, normal, -normalLength * b.mass / (a.mass + b.mass));
                    v.combine(b.position, normal, normalLength * a.mass / (a.mass + b.mass));

                    /*v.combine(a.velocity, normal, -normalLength * b.mass / (a.mass + b.mass));
                    v.combine(b.velocity, normal, normalLength * a.mass / (a.mass + b.mass));*/

                    // 1d impulses of balls
                    let normalVelocityA = v.dot(a.velocity, normal);
                    let normalVelocityB = v.dot(b.velocity, normal);

                    let tangentVelocityA = v.dot(a.velocity, tangent);
                    let tangentVelocityB = v.dot(b.velocity, tangent);

                    let av = (normalVelocityA * (a.mass - b.mass) + 2 * b.mass * normalVelocityB) / (a.mass + b.mass);
                    let bv = (normalVelocityB * (b.mass - a.mass) + 2 * a.mass * normalVelocityA) / (a.mass + b.mass);

                    a.velocity.x = (tangent.x * tangentVelocityA + normal.x * av) * a.bounce;
                    a.velocity.y = (tangent.y * tangentVelocityA + normal.y * av) * a.bounce;

                    b.velocity.x = (tangent.x * tangentVelocityB + normal.x * bv) * b.bounce;
                    b.velocity.y = (tangent.y * tangentVelocityB + normal.y * bv) * b.bounce;
                }
            }
        }

        for(let i=0; i<this.balls.length; i++) {
            const a = this.balls[i];
            if(!a.active) {
                continue;
            }
            if(a.position.y + a.size > this.height) {
                a.position.y -= a.position.y + a.size - this.height;
                a.velocity.y *= -a.bounce;
            }
            if(a.position.x - a.size < 0) {
                a.position.x -= a.position.x - a.size;
                a.velocity.x *= -a.bounce;
            }
            if(a.position.x + a.size > this.width) {
                a.position.x -= a.position.x + a.size - this.width;
                a.velocity.x *= -a.bounce;
            }
        }
    }
}

module.exports = World;
},{"./ball":1,"./vector":5}],4:[function(require,module,exports){

const PALETTE = {
	BACKGROUND: "#372D2D",
	BALLS: ["#FFFF00", "#00BE45", "#00C6FF", "#FF0007", "#924CAB"],
	SCORE_TEXT: "#E6E5E5",
	LEVEL_TEXT: "#A1DF91"
}

class Renderer {
    constructor(selector) {
        this.canvas = document.querySelector(selector);
        this.context = this.canvas.getContext("2d");
        this.width = 0;
        this.height = 0;
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    render(balls) {
        const ctx = this.context;
        ctx.fillStyle = PALETTE.BACKGROUND;
        ctx.fillRect(0, 0, this.width, this.height);

        for(let i=0; i<balls.length; i++) {
            const a = balls[i];
            if(!a.active) {
                continue;
            }
            ctx.beginPath();
            ctx.fillStyle = PALETTE.BALLS[a.color];
            ctx.arc(a.position.x, a.position.y, a.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

module.exports = Renderer;
},{}],5:[function(require,module,exports){

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
},{}]},{},[2]);
