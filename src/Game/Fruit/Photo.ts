import { Container, Sprite } from 'pixi.js';
import GraphicController from '../GraphicController';

export class Photo extends Container {
    private solo = new Sprite(this.randomSolo());
    private merge = new Sprite(this.getMerge());
    constructor() {
        super();
    }
    randomSolo() {
        return GraphicController.textures.get(
            `fruit_1_${Math.random() > 0.5 ? 's' : 'r'}`
        );
    }
    getMerge() {
        return GraphicController.textures.get(`fruit_1_merge`);
    }
}
