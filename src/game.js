
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