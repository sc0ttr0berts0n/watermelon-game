import { Container, Graphics } from 'pixi.js';
import Victor from 'victor';
import { Fruit, FruitOptions, FruitState } from './Fruit/Fruit';
import Game from './Game';
import Objects from '../Utils/Objects';
import gameSettings from '../game.settings';
import { Body } from 'matter-js';
import PhysicsWorld from './Matter/PhysicsWorld';
import PIXIHelper from '../Utils/PIXIHelper';
import anime from 'animejs';
import { Instructions } from './UI/Instructions';

export class PlayArea extends Container {
    public fruits: Fruit[] = [];
    public mouseX = gameSettings.playArea.size.x >> 1;
    private guideline = new Graphics();
    private activeTimeline: anime.AnimeInstance | null = null;
    public get targetFruit() {
        return this.fruits.find((el) => {
            return el.state === FruitState.PRE_DROP;
        });
    }

    constructor() {
        super();
        this.create();
        this.addListeners();
        Objects.set('PlayArea', this);
    }

    create() {
        const gfx = new Graphics()
            .beginFill(0xfee2b0)
            .drawRect(
                0,
                0,
                gameSettings.playArea.size.x,
                gameSettings.playArea.size.y
            )
            .endFill();
        this.addChild(gfx);

        this.guideline.lineStyle(10, 0x505050, 0.2);
        PIXIHelper.drawVerticalDashedLine(
            this.guideline,
            0,
            0,
            gameSettings.playArea.size.y,
            30,
            40
        );
        this.addChild(this.guideline);
        this.guideline.x = this.mouseX;
        this.guideline.alpha = 0;

        this.y = 200;

        this.eventMode = 'static';

        Game.app?.ticker.add(this.update.bind(this));
    }

    update() {
        // collsion test
        const removals: Set<number> = new Set();
        const newFruit: FruitOptions[] = [];
        for (let [i, fruit] of this.fruits.entries()) {
            let hit;
            // collision check
            for (let [j, other] of this.fruits.entries()) {
                // Guards
                if (
                    fruit === this.targetFruit ||
                    other === this.targetFruit ||
                    other === fruit ||
                    other.tier !== fruit.tier ||
                    !other?.body ||
                    !fruit?.body ||
                    other?.state !== FruitState.PHYSICS ||
                    fruit?.state !== FruitState.PHYSICS
                ) {
                    continue;
                }

                hit = PlayArea.hitTest(other.body, fruit.body, other.radius);
                if (hit) {
                    const nextTier = other.tier + 1;
                    const nextPos = new Victor(
                        (other.body.position.x + fruit.body.position.x) / 2,
                        (other.body.position.y + fruit.body.position.y) / 2
                    );
                    removals.add(i);
                    removals.add(j);
                    other.state = FruitState.MERGED;
                    fruit.state = FruitState.MERGED;

                    if (other.tier < gameSettings.global.tiers) {
                        newFruit.push({
                            pos: nextPos,
                            tier: nextTier,
                            addToPhysics: true,
                        });
                    }

                    if (!Objects.get<Instructions>('Instructions').hidden) {
                        Objects.get<Instructions>('Instructions').hide();
                    }
                }
            }
            fruit.update();
        }

        // // remove old fruit
        if (removals.size > 0) {
            const indexes = [...removals.values()].sort((a, b) => b - a);
            indexes.forEach((i) => {
                this.fruits[i].dispose();
                this.fruits.splice(i, 1);
            });
        }

        // // add new fruit
        newFruit.forEach((opts) => {
            setTimeout(() => {
                newFruit;
                this.addFruit(opts);
            }, 0);
        });

        if (this.targetFruit) {
            // reposition guideline
            this.guideline.x = this.targetFruit?.x ?? 0;
        }
    }

    async addListeners() {
        this.addEventListener('pointerup', async (e) => {
            if (!this.targetFruit || Game.gameover) return;
            this.mouseX = e.getLocalPosition(this).x;
            this.update();
            this.dropFruit();
            this.addFruit();
            await this.animateGuidelineSpawnOut();
            this.animateGuidelineSpawnIn();
        });
        this.addEventListener('pointermove', (e) => {
            this.mouseX = e.getLocalPosition(this).x;
        });
        document.addEventListener('gameover', () => {
            this.eventMode = 'none';
            this.fruits.forEach((fruit) => {
                if (fruit.y === 0) {
                    fruit.animateSpawnOut();
                }
            });
            this.animateGuidelineSpawnOut();
        });
    }

    addFruit(opts?: Partial<FruitOptions>) {
        if (Game.gameover) return;
        const pos = opts?.pos ?? new Victor(this.mouseX, 0);
        const fruit = this.addChild(new Fruit(pos, { ...opts }));
        this.fruits.push(fruit);
    }

    dropFruit() {
        if (!this.targetFruit) return;
        PhysicsWorld.addFruitBody(this.targetFruit);
        this.targetFruit.state = FruitState.PHYSICS;
    }

    private static hitTest(a: Body, b: Body, r: number) {
        const deltaX = b.position.x - a.position.x;
        const deltaY = b.position.y - a.position.y;
        const aa = deltaX ** 2;
        const bb = deltaY ** 2;
        const cc = aa + bb;

        return cc < (r * 2) ** 2;
    }

    async animateGuidelineSpawnIn(): Promise<void> {
        if (this.activeTimeline) {
            this.activeTimeline.pause();
        }
        return new Promise((resolve) => {
            const obj = {
                alpha: this.guideline.alpha,
            };
            this.activeTimeline = anime({
                targets: obj,
                delay: 1000,
                duration: 2000,
                alpha: 1,
                update: () => {
                    this.guideline.alpha = obj.alpha;
                },
                complete: () => {
                    resolve();
                },
            });
        });
    }
    async animateGuidelineSpawnOut(): Promise<void> {
        if (this.activeTimeline) {
            this.activeTimeline.pause();
        }
        return new Promise((resolve) => {
            const obj = {
                alpha: this.guideline.alpha,
            };
            this.activeTimeline = anime({
                targets: obj,
                duration: 200,
                scaleX: 0,
                scaleY: 0,
                alpha: 0,
                update: () => {
                    this.guideline.alpha = obj.alpha;
                },
                complete: () => {
                    resolve();
                },
            });
        });
    }
}
