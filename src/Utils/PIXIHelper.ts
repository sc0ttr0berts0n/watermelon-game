import { Graphics } from 'pixi.js';

export default class PIXIHelper {
    static drawVerticalDashedLine(
        graphics: Graphics,
        x: number,
        y: number,
        length: number,
        dashLength: number = 5,
        gapLength: number = 5
    ) {
        // Draw the dashed line vertically
        for (let i = y; i <= y + length; i += dashLength + gapLength) {
            graphics.moveTo(x, i);
            graphics.lineTo(x, i + dashLength);
        }
    }
}
