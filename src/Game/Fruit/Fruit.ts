import Matter from 'matter-js';
import { Container, Graphics } from 'pixi.js';
import Victor from 'victor';
import PhysicsWorld from '../Matter/PhysicsWorld';
import { PlayArea } from '../PlayArea';
import Objects from '../../Utils/Objects';
import anime from 'animejs';
import MathHelper from '../../Utils/MathHelper';
import gameSettings from '../../game.settings';
import { Scoreboard } from '../Scoreboard/Scoreboard';

const DEFAULTS = {
    TIERS: 11,
    MAX_SPAWN_TIER: 6,
    MIN_SIZE: 30,
    MAX_SIZE: 250,
    RESTITUTION: 0.2,
    FRICTION: 0.99,
    SLOP: 1.5,
    WAKE_FACTOR: 1.5,
} as const;

export type FruitOptions = {
    pos: Victor;
    tier: number;
    addToPhysics: boolean;
};

export enum FruitState {
    PRE_DROP,
    PHYSICS,
    MERGED,
}

export class Fruit extends Container {
    private gfx = new Graphics();
    public tier = Math.floor(Math.random() * DEFAULTS.MAX_SPAWN_TIER);
    public radius = 0;
    private color = 0;
    public locked = true;
    public pos: Victor;
    public body: Matter.Body | null = null;
    public state = FruitState.PRE_DROP;

    constructor(pos: Victor, opts?: Partial<FruitOptions>) {
        super();
        this.pos = pos;
        this.position.set(this.pos.x, this.pos.y);
        this.tier = opts?.tier ?? this.tier;
        this.radius = Fruit.getRadius(this.tier);
        this.color = Fruit.getColor(this.tier);
        if (opts?.addToPhysics) {
            this.body = PhysicsWorld.addFruitBody(this);
            this.state = FruitState.PHYSICS;
            this.locked = false;
        }
        this.redraw();
        this.addChild(this.gfx);
        this.animateSpawnIn();
    }

    redraw() {
        this.gfx.beginFill(this.color).drawCircle(0, 0, this.radius).endFill();
    }

    update() {
        if (this.body) {
            // physic object
            this.position.set(this.body.position.x, this.body.position.y);
            this.pos.x = this.position.x;
            this.pos.y = this.position.y;
        } else {
            // pre drop animated
            const pa = Objects.get<PlayArea>('PlayArea');
            const gap = pa.mouseX - this.x;
            const lerp = this.x + gap * 0.8;
            this.pos.x = MathHelper.clamp(
                this.radius,
                gameSettings.playArea.size.x - this.radius,
                lerp
            );
            this.position.set(this.pos.x, this.pos.y);
        }
    }

    static getRadius(tier: number) {
        const float = tier / (DEFAULTS.TIERS - 1);
        const range = DEFAULTS.MAX_SIZE - DEFAULTS.MIN_SIZE;
        return DEFAULTS.MIN_SIZE + float * range;
    }

    static getColor(tier: number) {
        let h = (tier / DEFAULTS.TIERS) * 360;
        let s = 50;
        let l = 50;

        function hslToHex(h: number, s: number, l: number) {
            l /= 100;
            const a = (s * Math.min(l, 1 - l)) / 100;
            const f = (n: number) => {
                const k = (n + h / 30) % 12;
                const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                return Math.round(255 * color)
                    .toString(16)
                    .padStart(2, '0'); // convert to Hex and prefix "0" if needed
            };
            return parseInt(`${f(0)}${f(8)}${f(4)}`, 16);
        }

        return hslToHex(h, s, l);
    }

    setBody(body: Matter.Body) {
        this.body = body;
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
            delay: this.locked ? 500 : 0,
            duration: 750,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            update: () => {
                (this.alpha = obj.alpha),
                    this.scale.set(obj.scaleX, obj.scaleY);
            },
            complete: () => {
                this.locked = false;
            },
        });
    }

    async animateSpawnOut(): Promise<void> {
        return new Promise((resolve) => {
            // if (!this.locked) return;
            const obj = {
                alpha: this.alpha,
                scaleX: this.scale.x,
                scaleY: this.scale.y,
            };
            anime({
                targets: obj,
                delay: this.locked ? 500 : 0,
                duration: 750,
                scaleX: 0,
                scaleY: 0,
                alpha: 0,
                update: () => {
                    (this.alpha = obj.alpha),
                        this.scale.set(obj.scaleX, obj.scaleY);
                },
                complete: () => {
                    this.locked = false;
                    resolve();
                },
            });
        });
    }

    async dispose() {
        Objects.get<Scoreboard>('Scoreboard').add(this.tier);
        this.state = FruitState.MERGED;
        PhysicsWorld.removeFruitBody(this.body);
        await this.animateSpawnOut();
        this.destroy();
    }
}
