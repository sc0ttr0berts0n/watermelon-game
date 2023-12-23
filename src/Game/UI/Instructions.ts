import { Container, Text } from 'pixi.js';
import { fontStyleObject } from './Scoreboard';
import Objects from '../../Utils/Objects';
import gameSettings from '../../game.settings';
import anime from 'animejs';

export class Instructions extends Container {
    public hidden = false;
    private txt_next = new Text(
        '💍\n\nCongrats to Ryan and Scott!\nMerge same sized circles.\nMerge Couples for Bonus Points.\n\n🎉',
        { ...fontStyleObject, align: 'center', fontSize: 40, fill: 0x000000 }
    );
    constructor() {
        super();
        Objects.set('Instructions', this);
        this.addChild(this.txt_next);
        this.pivot.x = this.width / 2;
        this.x = gameSettings.playArea.size.x / 2;
        this.y = 500;
    }

    hide(): Promise<void> {
        return new Promise((resolve) => {
            const obj = {
                alpha: this.alpha,
                y: this.y,
                scaleX: this.scale.x,
                scaleY: this.scale.y,
            };
            anime({
                targets: obj,
                duration: 2000,
                easing: 'easeInOutQuad',
                alpha: 0,
                y: this.y - 200,
                scaleX: this.scale.x * 1.2,
                scaleY: this.scale.y * 1.2,
                update: () => {
                    this.alpha = obj.alpha * obj.alpha;
                    this.y = obj.y;
                    this.scale.set(obj.scaleX, obj.scaleY);
                },
                complete: () => {
                    resolve();
                },
            });
        });
    }
}
