import anime from 'animejs';
import { Graphics } from 'pixi.js';
import Victor from 'victor';
import MathHelper from '../../Utils/MathHelper';

interface SliderOptions {
    pos: [Victor, Victor];
    radius: [number, number];
    color: [number, number];
    duration?: number;
    spawnCountOnDeath?: number;
    speed: number;
}

export class Slider extends Graphics {
    private opts: SliderOptions;
    private radius: number;
    private color: number;
    private pos: Victor;

    constructor(opts: SliderOptions) {
        super();
        this.opts = opts;
        this.pos = opts.pos[0];
        this.position.set(this.pos.x, this.pos.y);
        this.radius = opts.radius[0];
        this.color = opts.color[0];
        this.redraw();
        this.animate();
        this.animateSpawnIn();
    }

    redraw() {
        this.beginFill(this.color).drawCircle(0, 0, this.radius).endFill();
    }

    async animate() {
        // await this.animateSpawnIn();
        await this.animateTransition();
        this.dispose();
    }

    async animateSpawnIn(): Promise<void> {
        return new Promise((resolve) => {
            this.alpha = 0;
            this.scale.set(0);
            const obj = {
                alpha: this.alpha,
                scaleX: this.scale.x,
                scaleY: this.scale.y,
                radius: this.radius,
            };
            anime({
                targets: obj,
                duration: 50,
                scaleX: 1,
                scaleY: 1,
                alpha: 1,
                radius: this.opts.radius[1],
                update: () => {
                    this.alpha = obj.alpha;
                    this.scale.set(obj.scaleX, obj.scaleY);
                    this.radius = obj.radius;
                    this.redraw();
                },
                complete: () => {
                    resolve();
                },
            });
        });
    }

    async animateTransition(): Promise<void> {
        return new Promise((resolve) => {
            const obj = {
                posX: this.pos.x,
                posY: this.pos.y,
                percent: 0,
            };
            anime({
                targets: obj,
                duration: 400,
                posX: this.opts.pos[1].x,
                posY: this.opts.pos[1].y,
                percent: 1,
                easing: 'easeInBack',
                update: () => {
                    this.position.set(obj.posX, obj.posY);
                    this.color = Slider.tweenColors(
                        this.opts.color[0],
                        this.opts.color[1],
                        obj.percent
                    );
                    this.redraw();
                },
                complete: () => {
                    resolve();
                },
            });
        });
    }

    static tweenColors(
        colorA: number,
        colorB: number,
        percent: number
    ): number {
        // Extract RGB components from hexadecimal color representation
        const rA = (colorA >> 16) & 255;
        const gA = (colorA >> 8) & 255;
        const bA = colorA & 255;

        const rB = (colorB >> 16) & 255;
        const gB = (colorB >> 8) & 255;
        const bB = colorB & 255;

        // Interpolate between colorA and colorB based on percent
        const r = MathHelper.interpolate(rA, rB, percent);
        const g = MathHelper.interpolate(gA, gB, percent);
        const b = MathHelper.interpolate(bA, bB, percent);

        // Compose new color in hexadecimal format
        return (r << 16) + (g << 8) + b;
    }

    dispose() {
        this.destroy();
    }
}
