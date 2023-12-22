import { Assets, Texture } from 'pixi.js';
import Singleton from '../Utils/Singleton';

class GraphicController extends Singleton<GraphicController>() {
    public textures: Map<string, Texture> = new Map();
    async init() {
        Object.entries(
            await Assets.load([
                './public/assets/images/fruit_1_r.png',
                './public/assets/images/fruit_1_s.png',
                './public/assets/images/fruit_2_merge.png',
            ])
        ).forEach((entry) => {
            this.textures.set(
                entry[0].split('./public/assets/images/')[1],
                entry[1]
            );
        });
    }
}

export default GraphicController.getInstance();
