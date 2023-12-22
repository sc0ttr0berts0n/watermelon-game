import { Container, Graphics, Sprite, Texture } from 'pixi.js';
import GraphicController from '../GraphicController';
import { Fruit, FruitState } from './Fruit';
import anime from 'animejs';
import Game from '../Game';
import gameSettings from '../../game.settings';

export enum Person {
    SCOTT,
    RYAN,
}
export class Photo extends Container {
    private solo: Sprite | undefined;
    private merge: Sprite;
    public person: Person | undefined;
    constructor(fruit: Fruit) {
        super();
        this.person = this.getPerson(fruit);
        const mask = new Graphics()
            .beginFill(0xff0000)
            .drawCircle(0, 0, fruit.radius - 10)
            .endFill();
        this.addChild(mask);
        this.mask = mask;

        if (fruit.tier <= gameSettings.global.tiers - 1) {
            this.solo = new Sprite(this.randomSolo(fruit));
            this.addChild(this.solo);
            this.solo.width = mask.width;
            this.solo.height = mask.width;
            this.solo.anchor.set(0.5);
            this.solo.alpha = 0;
        }
        this.merge = new Sprite(this.getMerge(fruit));

        this.addChild(this.merge);

        this.merge.width = mask.width;
        this.merge.height = mask.width;

        this.merge.anchor.set(0.5);

        this.merge.alpha = 0;

        if (fruit.state === FruitState.PHYSICS) {
            this.merge.alpha = 1;
            if (this.solo) {
                this.animationMergeToSolo();
            }
        } else {
            if (this.solo) {
                this.solo.alpha = 1;
            }
        }
    }
    randomSolo(fruit: Fruit) {
        const { tier } = fruit;

        const string = `fruit_${tier + 1}_${
            this.person === Person.SCOTT ? 's' : 'r'
        }`;
        const texture = GraphicController.textures.get(string);
        if (!texture) debugger;
        return texture ?? Texture.WHITE;
    }
    getMerge(fruit: Fruit) {
        const { tier } = fruit;
        const texture = GraphicController.textures.get(
            `fruit_${tier + 1}_merge`
        );
        return texture ?? Texture.WHITE;
    }

    getPerson(fruit: Fruit): Person {
        const { tier } = fruit;
        const count = Game.tierCounts.get(tier) ?? Math.round(Math.random());
        Game.tierCounts.set(tier, count + 1);
        return count % 2;
    }

    private animationMergeToSolo() {
        this.animationMergeOut();
        this.animationSoloIn();
    }
    private animationMergeOut() {
        this.merge.alpha = 1;
        const obj = {
            alpha: this.merge.alpha,
            scaleX: this.merge.scale.x,
            scaleY: this.merge.scale.y,
        };
        anime({
            targets: obj,
            delay: 2000,
            duration: 1600,
            scaleX: this.merge.scale.x * 3,
            scaleY: this.merge.scale.y * 3,
            alpha: 0,
            update: () => {
                this.merge.alpha = obj.alpha;
                this.merge.scale.set(obj.scaleX, obj.scaleY);
            },
        });
    }
    private animationSoloIn() {
        if (!this.solo) return;
        this.solo.alpha = 0;
        const obj = {
            alpha: this.solo.alpha,
            scaleX: this.solo.scale.x * 2,
            scaleY: this.solo.scale.y * 2,
            rotation: Math.random() * 10 - 5,
        };
        anime({
            targets: obj,
            delay: 1500,
            duration: 2000,
            scaleX: this.solo.scale.x,
            scaleY: this.solo.scale.y,
            alpha: 1,
            rotation: 0,
            update: () => {
                if (!this.solo) return;
                this.solo.alpha = obj.alpha;
                this.solo.scale.set(obj.scaleX, obj.scaleY);
                this.solo.rotation = obj.rotation;
            },
        });
    }
}
