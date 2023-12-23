import { Container, Text } from 'pixi.js';
import { fontStyleObject } from './Scoreboard';
import Objects from '../../Utils/Objects';
import gameSettings from '../../game.settings';
import anime from 'animejs';

export class Instructions extends Container {
    public hidden = false;
    private txt_next = new Text(
        '🎉Congrats to Ryan and Scott!🎉\nMerge same sized circles.\nMerge Couples for Bonus Points.',
        { ...fontStyleObject, align: 'center', fontSize: 40, fill: 0x000000 }
    );
    constructor() {
        super();
        Objects.set('Instructions', this);
        this.addChild(this.txt_next);
        this.pivot.x = this.width / 2;
        this.x = gameSettings.playArea.size.x / 2;
        this.y = 600;
    }

    hide(): Promise<void> {
        return new Promise((resolve) => {
            const obj = {
                alpha: this.alpha,
            };
            anime({
                targets: obj,
                duration: 2000,
                easing: 'easeOutQuad',
                alpha: 0,
                update: () => {
                    this.alpha = obj.alpha;
                },
                complete: () => {
                    resolve();
                },
            });
        });
    }
}
