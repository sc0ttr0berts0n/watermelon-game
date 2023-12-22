import { Container, Graphics, Text } from 'pixi.js';
import gameSettings from '../../game.settings';
import Game from '../Game';
import { FruitState } from '../Fruit/Fruit';
import anime from 'animejs';

export class FailBar extends Container {
    public triggerd = false;
    public heat = 0;
    private gfx = new Graphics()
        .beginFill(0xff5050)
        .drawRect(
            0,
            0,
            gameSettings.failBar.size.x,
            gameSettings.failBar.size.y
        )
        .endFill();
    private txt_gameOver = new Text('GAMEOVER', {
        fontFamily: 'monospace',
        fontSize: 120,
        fontWeight: 'bold',
        fill: 0xffffff,
    });
    constructor() {
        super();

        this.addChild(this.gfx);
        this.gfx.addChild(this.txt_gameOver);

        // this.alpha = 0;
        // this.pivot.y = gameSettings.failBar.size.y;
        // this.y = gameSettings.failBar.size.y;

        this.txt_gameOver.x = gameSettings.failBar.size.x / 2;
        this.txt_gameOver.y = gameSettings.failBar.size.y / 2;
        this.txt_gameOver.pivot.x = this.txt_gameOver.width / 2;
        this.txt_gameOver.pivot.y = this.txt_gameOver.height / 2;
        this.txt_gameOver.alpha = 0;
        this.txt_gameOver.scale.set(0);

        Game.app?.ticker.add(this.update.bind(this));
    }

    update() {
        if (this.triggerd) return;
        const overflow = Game.playArea?.fruits.some((fruit) => {
            if (fruit.state !== FruitState.PHYSICS) return false;
            if (fruit.physicsAge < gameSettings.failBar.minAge) return false;
            return fruit.y - fruit.radius <= 0;
        });

        if (overflow) {
            this.heat = Math.min(
                1,
                this.heat + gameSettings.failBar.heatIncreaseRate
            );
        } else {
            this.heat = Math.max(
                0,
                this.heat - gameSettings.failBar.heatDecreaseRate
            );
        }

        this.scale.y = this.heat ** 2;

        if (this.heat === 1) {
            this.triggerd = true;
            this.animateOut();
            Game.app?.ticker.remove(this.update);
            document.dispatchEvent(new Event('gameover'));
        }
    }

    async animateOut(): Promise<void> {
        this.pivot.x = gameSettings.failBar.size.x / 2;
        this.pivot.y = gameSettings.failBar.size.y / 2;
        this.x = gameSettings.failBar.size.x / 2;
        this.y = gameSettings.failBar.size.y / 2;
        return new Promise((resolve) => {
            const obj = {
                scaleX: this.scale.x,
                scaleY: this.scale.y,
            };
            anime({
                targets: obj,
                delay: 2800,
                duration: 300,
                scaleX: 0,
                scaleY: 0,
                alpha: 0,
                easing: 'easeInOutExpo',
                begin: () => {
                    this.animateInGameover();
                },
                update: () => {
                    this.scale.set(obj.scaleX, obj.scaleY);
                },
                complete: () => {
                    resolve();
                },
            });
        });
    }
    async animateInGameover(): Promise<void> {
        return new Promise((resolve) => {
            const obj = {
                alpha: this.txt_gameOver.alpha,
                scaleX: this.txt_gameOver.scale.x,
                scaleY: this.txt_gameOver.scale.y,
            };
            anime({
                targets: obj,
                duration: 1000,
                scaleX: 1,
                scaleY: 1,
                alpha: 1,
                update: () => {
                    this.txt_gameOver.alpha = obj.alpha;
                    this.txt_gameOver.scale.set(obj.scaleX, obj.scaleY);
                },
                complete: () => {
                    resolve();
                },
            });
        });
    }
}
