import { Container, Graphics, Text } from 'pixi.js';
import { fontStyleObject } from './Scoreboard';
import Objects from '../../Utils/Objects';
import gameSettings from '../../game.settings';
import anime from 'animejs';

export class Replay extends Container {
    public hidden = false;
    private gfx = new Graphics();
    private txt_replay = new Text('Try Again 🔄', {
        ...fontStyleObject,
        fontWeight: 'bold',
        align: 'center',
        fontSize: 80,
    });
    constructor() {
        super();
        Objects.set('Replay', this);
        this.addChild(this.txt_replay);
        this.gfx
            .beginFill(0x000000, 0.5)
            .drawRoundedRect(
                this.txt_replay.x - 25,
                this.txt_replay.y - 25,
                this.txt_replay.width + 50,
                this.txt_replay.height + 50,
                12.5
            )
            .endFill();
        this.addChild(this.gfx);
        this.children.reverse();
        this.pivot.x = this.width / 2;
        this.x = gameSettings.playArea.size.x / 2 + 25;
        this.y = 900;
        this.visible = false;
        this.eventMode = 'static';
        this.cursor = 'pointer';

        this.addEventListener('pointerup', async () => {
            // debugger;
            window.location.reload();
        });

        document.addEventListener('gameover', () => {
            setTimeout(() => {
                this.show();
            }, 5000);
        });
    }

    show(): Promise<void> {
        this.visible = true;
        return new Promise((resolve) => {
            const obj = {
                alpha: this.alpha,
                y: this.y + 100,
                scaleX: this.scale.x * 0.8,
                scaleY: this.scale.y * 0.8,
            };
            anime({
                targets: obj,
                duration: 750,
                alpha: 1,
                y: this.y,
                scaleX: this.scale.x,
                scaleY: this.scale.y,
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
