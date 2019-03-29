
const Renderer = require('./renderer');
const World = require('./physics');

class Game {
	constructor() {
		this.width = 600; //window.innerWidth;
		this.height = 400; //window.innerHeight;
		this.renderer = new Renderer('.game-canvas');
		this.world = new World(this.width, this.height, 120);

		this.renderer.resize(this.width, this.height);
		this.world.init();
		this.initListeners();
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
		ball.active = false;
	}

	frame() {
		this.world.update(0.1);
		this.renderer.render(this.world.balls);
	}
}

const game = new Game();

game.frame();

setInterval(function() {
	game.frame();
}, 30);