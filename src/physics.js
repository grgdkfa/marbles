
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

            a.size = (minSize + Math.random() * (maxSize - minSize)) / 2;

            a.velocity.x = Math.random() - 0.5;
            a.velocity.y = Math.random() - 0.5;

            a.active = true;
        }
    }

    solve(dt) {
        const g = v.scale(this.gravity, dt);

        for(let i=0; i<this.balls.length; i++) {
            const a = this.balls[i];
            v.adds(a.velocity, g, a.velocity);
            v.combine(a.position, a.velocity, dt);
        }

        const distance = new v.Vector();
        const impulse = new v.Vector();

        for(let i=0; i<this.balls.length - 1; i++) {
            const a = this.balls[i];
            for(let j=i+1; j<this.balls.length; j++) {
                const b = this.balls[j];

                v.subs(a.position, b.position, distance);
                if(distance.sqrLength() < Math.pow(a.size + b.size, 2)) {
                    let distanceLength = distance.length();
                    distance.scale(1 / distanceLength);
                    distanceLength -= a.size + b.size;

                    v.combine(a.position, distance, -distanceLength * 0.5);
                    v.combine(b.position, distance, distanceLength * 0.5);

                    impulse.x = 2 * (a.mass * a.velocity.x + b.mass * b.velocity.x) / (a.mass * b.mass);
                    impulse.y = 2 * (a.mass * a.velocity.y + b.mass * b.velocity.y) / (a.mass * b.mass);

                    /*a.velocity.addImpulse(impulse, a.bounce);
                    b.velocity.addImpulse(impulse, b.bounce);*/
                }
            }
        }

        for(let i=0; i<this.balls.length; i++) {
            const a = this.balls[i];
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