
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