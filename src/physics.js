
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
        const maxSize = this.width * 0.10;
        const minSize = this.width * 0.04;
        for(let i=0; i<this.balls.length; i++) {
            const a = this.balls[i];
            a.position.x = Math.random() * this.width;
            a.position.y = this.height - Math.random() * this.height * 4;

            a.setSize((minSize + Math.pow(Math.random(), 1.5) * (maxSize - minSize)) / 2);

            a.velocity.x = Math.random() - 0.5;
            a.velocity.y = Math.random() - 0.5;
            a.velocity.scale(150);

            a.active = true;
        }
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
        const PUSH = 1 + 1e-4;
        const KICK = 1;

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

                    v.combine(a.position, normal, -normalLength * b.mass * PUSH / (a.mass + b.mass));
                    v.combine(b.position, normal, normalLength * a.mass * PUSH / (a.mass + b.mass));

                    v.combine(a.velocity, normal, -KICK * b.mass / (a.mass + b.mass));
                    v.combine(b.velocity, normal, KICK * a.mass / (a.mass + b.mass));

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