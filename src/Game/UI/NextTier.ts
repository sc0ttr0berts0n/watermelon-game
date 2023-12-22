import { Container, Text } from 'pixi.js';
import { TierBall } from './TierBall';
import { fontStyleObject } from './Scoreboard';
import Game from '../Game';
import Objects from '../../Utils/Objects';

export class NextTier extends Container {
    private ball: TierBall | undefined;
    private txt_next = new Text('Next: ', fontStyleObject);
    constructor() {
        super();
        Objects.set('NextTier', this);
        this.addChild(this.txt_next);
        this.x = 600;
        this.y = 60;
        this.redraw();
    }

    redraw() {
        if (this.ball) {
            this.removeChild(this.ball);
        }
        this.ball = this.addChild(new TierBall(Game.nextTier, 12));
        this.ball.x = this.txt_next.width + 10;
        this.ball.y = 20;
    }
}
