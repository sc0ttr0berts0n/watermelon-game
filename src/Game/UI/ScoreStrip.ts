import { Container } from 'pixi.js';
import gameSettings from '../../game.settings';
import { TierBall } from './TierBall';

export class ScoreStrip extends Container {
    constructor() {
        super();
        new Array(gameSettings.global.tiers).fill(0).forEach((_el, tier) => {
            const tierBall = new TierBall(tier);
            tierBall.x = tier * (32 + 10);
            this.addChild(tierBall);
        });
        this.x = gameSettings.playArea.size.x - this.width;
        this.y = 30;
    }
}
