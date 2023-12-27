import Matter from 'matter-js';
import { Container, Graphics } from 'pixi.js';
import Victor from 'victor';
import PhysicsWorld from '../Matter/PhysicsWorld';
import { PlayArea } from '../PlayArea';
import Objects from '../../Utils/Objects';
import anime from 'animejs';
import MathHelper from '../../Utils/MathHelper';
import gameSettings from '../../game.settings';
import { Scoreboard } from '../UI/Scoreboard';
import Game from '../Game';
import { Photo } from './Photo';

export type FruitOptions = {
    pos: Victor;
    tier: number;
    addToPhysics: boolean;
};

export enum FruitState {
    SPAWN_LOCKED,
    PRE_DROP,
    PHYSICS,
    MERGED,
    DISPOSED,
}

export class Fruit extends Container {
    private gfx = new Graphics();
    public tier = Game.fetchTier;
    // public tier = Game.counter++ >> 2; // debug to get all fruit quick
    public radius = 0;
    private color = 0;
    public age = 0;
    public physicsAge = 0;
    public pos: Victor;
    public body: Matter.Body | null = null;
    public state = FruitState.SPAWN_LOCKED;
    public photo: Photo | undefined;

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
        }
        this.photo = new Photo(this);
        this.redraw();
        this.addChild(this.gfx);
        this.gfx.addChild(this.photo);
        this.animateSpawnIn();
    }

    redraw() {
        this.gfx.beginFill(this.color).drawCircle(0, 0, this.radius).endFill();
    }

    update() {
        if (this.state === FruitState.DISPOSED) return;
        if (this.body) {
            // physic object
            this.position.set(this.body.position.x, this.body.position.y);
            this.pos.x = this.position.x;
            this.pos.y = this.position.y;
            this.physicsAge++;
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
        this.age++;
    }

    static getRadius(tier: number) {
        const { tiers } = gameSettings.global;
        const { minSize, maxSize } = gameSettings.fruit;

        const float = tier / (tiers - 1);
        const range = maxSize - minSize;
        return minSize + float * range;
    }

    static getColor(tier: number) {
        let h = (tier / gameSettings.global.tiers) * 720;
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
            delay: this.state === FruitState.SPAWN_LOCKED ? 500 : 0,
            duration: 750,
            scaleX: 1,
            scaleY: 1,
            alpha: 1,
            update: () => {
                (this.alpha = Game.gameover ? 0 : obj.alpha),
                    this.scale.set(obj.scaleX, obj.scaleY);
            },
            complete: () => {
                if (this.state === FruitState.SPAWN_LOCKED) {
                    this.state = FruitState.PRE_DROP;
                }
            },
        });
    }

    async animateSpawnOut(): Promise<void> {
        return new Promise((resolve) => {
            const obj = {
                alpha: this.alpha,
                scaleX: this.scale.x,
                scaleY: this.scale.y,
            };
            anime({
                targets: obj,
                duration: 750,
                scaleX: 0,
                scaleY: 0,
                alpha: 0,
                update: () => {
                    (this.alpha = obj.alpha),
                        this.scale.set(obj.scaleX, obj.scaleY);
                },
                complete: () => {
                    resolve();
                },
            });
        });
    }

    async dispose() {
        Objects.get<Scoreboard>('Scoreboard').add(this.tier + 1);
        PhysicsWorld.removeFruitBody(this.body);
        this.state = FruitState.DISPOSED;
        await this.animateSpawnOut();
        this.destroy();
    }
}
