import { Container, Graphics, Text } from 'pixi.js';
import { Fruit } from '../Fruit/Fruit';

export class TierBall extends Container {
    constructor(tier: number, baseSize = 8) {
        super();
        const color = Fruit.getColor(tier);
        const gfx = new Graphics()
            .beginFill(color)
            .drawCircle(0, 0, baseSize * 2)
            .endFill();
        this.addChild(gfx);
        const text = new Text(tier.toString(), {
            fontFamily: 'monospace',
            fontSize: baseSize * 3,
            fill: 0xffffff,
        });
        text.anchor.set(0.5);
        gfx.addChild(text);
    }
}
