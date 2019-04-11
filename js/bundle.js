(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const v = require('./vector');

// vmin units
const MIN_SIZE = 2;
const MAX_SIZE = 5;

class Ball {
    constructor(id) {
        this.id = id;
        this.active = false;
        this.timer = 0;

        this.bounce = 0.5;
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
const v = require('./vector');

class ContactManager {
	constructor(count) {
		this.treshold = 0.02;
		this.links = [];
		this.hasContacts = false;
		for(let i = 0; i < count - 1; i++) {
			this.links.push([]);
			for(let j = i + 1; j < count; j++) {
				this.links[i].push(false);
			}
		}
	}

	reset() {
		for(let i = 0; i < this.links.length; i++) {
			for(let j = 0; j < this.links[i].length; j++) {
				this.links[i][j] = false;
			}
		}
	}

	check(balls) {
		this.reset();
		this.hasContacts = false;
		const d = new v.Vector();
		for(let i=0; i < this.links.length - 1; i++) {
			const a = balls[i];
			if(!a.active) continue;
			for(let j = 0; j < this.links[i].length; j++) {
				const b = balls[i + 1 + j];
				if(!b.active) continue;
				v.subs(a.position, b.position, d);
				if(a.color == b.color
					&& a.timer == 0
					&& b.timer == 0
					&& d.sqrLength() < Math.pow( (a.size + b.size) * (1 + this.treshold), 2)) {
					this.hasContacts = true;
					this.links[i][j] = true;
				} else {
					this.links[i][j] = false;
				}
			}
		}
	}

	isConnected(ball) {
		const id = ball.id;
		for(let i = 0; i < this.links.length; i++) {
			if(this.areColliding(id, i))
				return true;
		}
		return false;
	}

	areColliding(i, j) {
		if(i == j) {
			return false; // a hack
		}
		if(i < j) {
			return this.links[i][j - i - 1];
		} else {
			return this.links[j][i - j - 1];
		}
	}

	setColliding(i, j, value) {
		if(i == j) {
			return false; // a hack
		}
		if(i < j) {
			this.links[i][j - i - 1] = value;
		} else {
			this.links[j][i - j - 1] = value;
		}
	}

	getCluster(ball) {
		const cluster = [];
		const queue = [{
			id: ball.id,
			level: 1
		}];
		while(queue.length) {
			const current = queue.shift();
			cluster.push(current);
			for(let i = 0; i < this.links.length; i++) {
				if(i == current.id) continue;
				if(this.areColliding(current.id, i)) {
					queue.push({ id: i, level: current.level + 1 });
					this.setColliding(current.id, i, false);
				}
			}
		}
		return cluster;
	}
}

class SignPainter {
	constructor() {

	}

	showScore(x, y, amount) {
		const sign = document.createElement('div');
		document.body.appendChild(sign);
		sign.addEventListener('animationend', function() {
			document.body.removeChild(this);
		});
		sign.classList.add('rise');
		sign.style.top = `${y}px`;
		sign.style.left = `${x}px`;
		sign.textContent = amount;
	}

	showCountdown(countdown) {
		const sign = document.createElement('div');
		document.body.appendChild(sign);
		sign.addEventListener('animationend', function() {
			document.body.removeChild(this);
		});
		sign.classList.add('rise');
		sign.classList.add('countdown');
		sign.style.top = `${window.innerHeight / 2}px`;
		sign.style.left = `${window.innerWidth / 2}px`;
		sign.textContent = countdown;
	}

	showPenalty(amount) {
		const sign = document.createElement('div');
		document.body.appendChild(sign);
		sign.addEventListener('animationend', function() {
			document.body.removeChild(this);
		});
		sign.classList.add('rise');
		sign.classList.add('penalty');
		sign.style.top = `${window.innerHeight / 2}px`;
		sign.style.left = `${window.innerWidth / 2}px`;
		sign.textContent = amount;
	}
}

class Game {
	constructor() {
		this.ballCount = 120;
		this.width = window.innerWidth;
		this.height = window.innerHeight;
		this.renderer = new Renderer('.game-canvas');
		this.world = new World(this.width, this.height, this.ballCount);
		this.contacts = new ContactManager(this.ballCount);
		this.signPainter = new SignPainter();

		this.level = 1;
		this.score = 0;
		this.countDown = 0;
		this.countDownTimeout = 0;

		this.renderer.resize(this.width, this.height);
		this.world.init();
		this.initListeners();

		this.updateLevel();
		this.updateScore();
	}

	updateLevel() {
		document.querySelector('.level').textContent = `Level ${this.level}`;
	}

	updateScore() {
		document.querySelector('.score').textContent = `${this.score} points`;
	}

	addScore(amount) {
		this.score += amount;
		this.updateScore();
	}

	initListeners() {
		this.renderer.canvas.addEventListener("click", event => {
			const x = event.pageX;
			const y = event.pageY;
			const ball = this.world.getBallAt(x, y);
			if(ball) {
				this.ballClick(ball);
			}
		});
	}

	ballClick(ball) {
		if(this.contacts.isConnected(ball)) {
			const cluster = this.contacts.getCluster(ball);
			cluster.forEach(contact => this.world.balls[contact.id].timer = contact.level * 3);
			const score = Math.floor(Math.pow(cluster.length - 1, 1.5));
			this.addScore(score);
			this.signPainter.showScore(ball.position.x, ball.position.y, score);
		}
	}

	nextLevel() {
		let penalty = 0;
		for(let i=0; i<this.world.balls.length; i++) {
			if(this.world.balls[i].active) {
				penalty++;
			}
		}
		penalty = penalty * penalty;
		this.addScore(-penalty);
		this.level++;
		this.updateLevel();
		this.signPainter.showPenalty(-penalty);
		this.world.spawnBalls();
	}

	frame() {
		const balls = this.world.balls;

		this.world.update(0.1);
		this.renderer.render(balls, this.contacts.links);
		this.contacts.check(balls);

		for(let i = 0; i < balls.length; i++) {
			if(balls[i].timer == 1) {
				balls[i].active = false;
			}
			balls[i].timer = balls[i].timer == 0 ? 0 : balls[i].timer - 1;
		}

		if(!this.contacts.hasContacts && !this.countDownTimeout) {
			this.countDownTimeout = setTimeout(() => {
				if(this.hasContacts) {
					this.countDown = 0;
					return;
				}
				this.signPainter.showCountdown(5 - this.countDown);
				this.countDown++;
				if(this.countDown == 5) {
					this.nextLevel();
				} else {
					this.countDownTimeout = 0;
				}
			}, 1000);
		}
	}
}

const game = new Game();

game.frame();

setInterval(function() {
	game.frame();
}, 30);
},{"./physics":3,"./renderer":4,"./vector":5}],3:[function(require,module,exports){

const v = require('./vector');
const Ball = require('./ball');

class World {
    constructor(width, height, count) {
        this.width = width;
        this.height = height;
        this.gravity = new v.Vector(0, 25);
        this.setCount(count);

        this.iterations = 10;
    }

    setCount(count) {
        count = count || 0;
        this.balls = new Array(count);
        for(let i = 0; i < count; i++) {
            this.balls[i] = new Ball(i);
        }
    }

    init() {
        this.spawnBalls();
        /*const a = new Ball();
        a.position.set(100, 350);
        a.velocity.set(0, 0);
        a.size = 50;
        a.mass = 1;
        a.active = true;
        this.balls[0] = a;

        const b = new Ball();
        b.position.set(101, 250);
        b.velocity.set(0, 0);
        b.size = 50;
        b.mass = 1;
        b.active = true;
        this.balls[1] = b;*/
    }

    spawnBalls() {
        const maxSize = this.width * devicePixelRatio * 0.08;
        const minSize = this.width * devicePixelRatio * 0.03;
        for(let i=0; i<this.balls.length; i++) {
            const a = this.balls[i];
            if(a.active) {
                continue;
            }
            a.position.x = Math.random() * this.width;
            a.position.y = this.height - Math.random() * this.height * 4;

            a.setSize((minSize + Math.pow(Math.random(), 1.5) * (maxSize - minSize)) / 2);

            a.velocity.x = Math.random() - 0.5;
            a.velocity.y = Math.random() - 0.5;
            a.velocity.scale(150);

            a.active = true;
        }
    }

    update(dt) {
        for(let i=0; i<this.iterations; i++) {
            this.solve(dt / this.iterations);
        }
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

        // makeshift regularization parameter
        const PUSH = 0.1;
        const KICK = this.gravity.length() * 1e-0;

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
                    if(normalLength > 0) {
                        debugger;
                        normalLength = 0;
                    }

                    v.combine(a.position, normal, -(normalLength - PUSH) * b.mass / (a.mass + b.mass));
                    v.combine(b.position, normal, (normalLength - PUSH) * a.mass / (a.mass + b.mass));

                    // 1d impulses of balls
                    let normalVelocityA = v.dot(a.velocity, normal);
                    let normalVelocityB = v.dot(b.velocity, normal);

                    let tangentVelocityA = v.dot(a.velocity, tangent);
                    let tangentVelocityB = v.dot(b.velocity, tangent);

                    let av = (normalVelocityA * (a.mass - b.mass) + 2 * b.mass * normalVelocityB) / (a.mass + b.mass);
                    let bv = (normalVelocityB * (b.mass - a.mass) + 2 * a.mass * normalVelocityA) / (a.mass + b.mass);

                    a.velocity.x = (tangent.x * tangentVelocityA + normal.x * av * a.bounce);
                    a.velocity.y = (tangent.y * tangentVelocityA + normal.y * av * a.bounce);

                    b.velocity.x = (tangent.x * tangentVelocityB + normal.x * bv * b.bounce);
                    b.velocity.y = (tangent.y * tangentVelocityB + normal.y * bv * b.bounce);

                    v.combine(a.velocity, normal, -KICK * normalLength * b.mass / (a.mass + b.mass));
                    v.combine(b.velocity, normal, KICK * normalLength * a.mass / (a.mass + b.mass));
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

    getBallAt(x, y) {
        const point = new v.Vector(x, y);
        const delta = new v.Vector();
        for(let i=0; i<this.balls.length; i++) {
            const ball = this.balls[i];
            if(!ball.active) {
                continue;
            }
            v.subs(ball.position, point, delta);

            if(delta.sqrLength() < ball.size * ball.size) {
                return ball;
            }
        }
        return null;
    }
}

module.exports = World;
},{"./ball":1,"./vector":5}],4:[function(require,module,exports){

const v = require('./vector');

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

    render(balls, contacts) {
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
},{"./vector":5}],5:[function(require,module,exports){

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
