
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