import anime from 'animejs';
import { Graphics } from 'pixi.js';
import Victor from 'victor';
import gameSettings from '../../game.settings';
import Objects from '../../Utils/Objects';
import { PlayArea } from '../PlayArea';

export interface SparkOptions {
    pos: Victor | (() => Victor);
    vel: Victor | (() => Victor);
    acc: Victor | (() => Victor);
    gravity: Victor | (() => Victor);
    radius: number | (() => number);
    color: number;
    lifespan: number;
    spawnCountOnDeath: number;
}

export class Spark extends Graphics {
    // private opts: Partial<SparkOptions>;
    public radius = 0;
    private color = 0;
    private age = 0;
    private lifespan;
    private pos: Victor;
    private vel: Victor;
    private acc: Victor;
    private gravity: Victor;
    private spawnCountOnDeath: number;
    public get dead() {
        return this.age > this.lifespan;
    }

    constructor(opts?: Partial<SparkOptions>) {
        super();

        // resolve possible expressions
        const pos = typeof opts?.pos === 'function' ? opts.pos() : opts?.pos;
        const vel = typeof opts?.vel === 'function' ? opts.vel() : opts?.vel;
        const acc = typeof opts?.acc === 'function' ? opts.acc() : opts?.acc;
        const gravity =
            typeof opts?.gravity === 'function'
                ? opts.gravity()
                : opts?.gravity;
        const radius =
            typeof opts?.radius === 'function' ? opts.radius() : opts?.radius;

        // this.opts = opts ?? {};
        this.pos =
            pos?.clone() ??
            new Victor(
                gameSettings.playArea.size.x / 2,
                gameSettings.playArea.size.y / 2
            );
        this.vel = vel?.clone() ?? new Victor(0, 0);
        this.acc = acc?.clone() ?? new Victor(0, 0);
        this.position.set(this.pos.x, this.pos.y);
        this.radius = radius ?? 20;
        this.color = opts?.color ?? 0xffffff;
        this.lifespan = opts?.lifespan ?? 100;
        this.gravity =
            gravity?.clone() ??
            new Victor(
                Math.random() * 2 - 1,
                Math.random() * 2 - 1
            ).multiplyScalar(0.1);
        this.spawnCountOnDeath = opts?.spawnCountOnDeath ?? 0;
        this.redraw();
        this.animateSpawnIn();
    }

    redraw() {
        this.beginFill(this.color).drawCircle(0, 0, this.radius).endFill();
    }

    update() {
        this.acc.add(this.gravity);
        this.vel.add(this.acc);
        this.pos.add(this.vel);

        this.acc.multiplyScalar(0);

        this.position.set(this.pos.x, this.pos.y);

        this.age++;

        if (this.dead) {
            this.dispose();
        }
    }

    animateSpawnIn() {
        this.alpha = 0;
        this.scale.set(0);
        const obj = {
            alpha: this.alpha,
            scaleX: this.scale.x,
            scaleY: this.scale.y,
        };
        anime({
            targets: obj,
            duration: 200,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            update: () => {
                this.alpha = obj.alpha;
                this.scale.set(obj.scaleX, obj.scaleY);
            },
        });
    }

    async animateSpawnOut(): Promise<void> {
        if (this.spawnCountOnDeath > 0) {
            const pa = Objects.get<PlayArea>('PlayArea');
            pa.sparks.push(
                ...Array(this.spawnCountOnDeath)
                    .fill(0)
                    .map((_el) => {
                        return pa.addChild(
                            new Spark({
                                pos: this.pos.clone(),
                                vel: this.vel
                                    .clone()
                                    .rotateBy((Math.PI / 2) * Math.random())
                                    .multiplyScalar(Math.random() / 2 + 0.5),
                                gravity: new Victor(0, this.gravity.length()),
                                lifespan: Math.random() * 25 + 25,
                                radius: Math.random() * 5 + 5,
                            })
                        );
                    })
            );
        }

        return new Promise((resolve) => {
            const obj = {
                alpha: this.alpha,
                scaleX: this.scale.x,
                scaleY: this.scale.y,
            };
            anime({
                targets: obj,
                duration: 750,
                scaleX: 2,
                scaleY: 2,
                alpha: 0,
                update: () => {
                    this.alpha = obj.alpha;
                    this.scale.set(obj.scaleX, obj.scaleY);
                },
                complete: () => {
                    resolve();
                },
            });
        });
    }

    async dispose() {
        await this.animateSpawnOut();
        this.destroy();
    }
}
