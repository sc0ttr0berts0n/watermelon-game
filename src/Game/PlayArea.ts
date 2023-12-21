import { Container, Graphics } from 'pixi.js';
import Victor from 'victor';
import { Fruit, FruitOptions, FruitState } from './Fruit/Fruit';
import Game from './Game';
import Objects from '../Utils/Objects';
import gameSettings from '../game.settings';
import { Body } from 'matter-js';
import PhysicsWorld from './Matter/PhysicsWorld';

export class PlayArea extends Container {
    private fruits: Fruit[] = [];
    public mouseX = gameSettings.playArea.size.x >> 1;
    public get targetFruit() {
        return this.fruits.find((el) => el.state === FruitState.PRE_DROP);
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
                    other?.locked ||
                    fruit?.locked ||
                    other.state === FruitState.MERGED ||
                    fruit.state === FruitState.MERGED
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

                    newFruit.push({
                        pos: nextPos,
                        tier: nextTier,
                        addToPhysics: true,
                    });
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
            // console.log(removals.size);
        }

        // // add new fruit
        newFruit.forEach((opts) => {
            setTimeout(() => {
                newFruit;
                this.addFruit(opts);
            }, 0);
        });
        // if (newFruit.length > 0) {
        //     console.log(newFruit.length);
        // }
    }

    addListeners() {
        this.addEventListener('pointerup', async () => {
            if (this.targetFruit?.locked) return;
            this.dropFruit();
            this.addFruit();
        });
        this.addEventListener('pointermove', (e) => {
            this.mouseX = e.getLocalPosition(this).x;
        });
    }

    addFruit(opts?: FruitOptions) {
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
}
