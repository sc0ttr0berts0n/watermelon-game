import { Assets, Texture } from 'pixi.js';
import Singleton from '../Utils/Singleton';

class GraphicController extends Singleton<GraphicController>() {
    public textures: Map<string, Texture> = new Map();
    async init() {
        const textures = await Assets.load([
            './public/assets/images/fruit_1_r.png',
            './public/assets/images/fruit_1_s.png',
            './public/assets/images/fruit_2_merge.png',
            './public/assets/images/fruit_2_r.png',
            './public/assets/images/fruit_2_s.png',
            './public/assets/images/fruit_3_merge.png',
            './public/assets/images/fruit_3_r.png',
            './public/assets/images/fruit_3_s.png',
            './public/assets/images/fruit_4_merge.png',
            './public/assets/images/fruit_4_r.png',
            './public/assets/images/fruit_4_s.png',
            './public/assets/images/fruit_5_merge.png',
            './public/assets/images/fruit_5_r.png',
            './public/assets/images/fruit_5_s.png',
            './public/assets/images/fruit_6_merge.png',
            './public/assets/images/fruit_6_r.png',
            './public/assets/images/fruit_6_s.png',
            './public/assets/images/fruit_7_merge.png',
            './public/assets/images/fruit_7_r.png',
            './public/assets/images/fruit_7_s.png',
            './public/assets/images/fruit_8_merge.png',
            './public/assets/images/fruit_8_r.png',
            './public/assets/images/fruit_8_s.png',
            './public/assets/images/fruit_9_merge.png',
            './public/assets/images/fruit_9_r.png',
            './public/assets/images/fruit_9_s.png',
            './public/assets/images/fruit_10_merge.png',
            './public/assets/images/fruit_10_r.png',
            './public/assets/images/fruit_10_s.png',
            './public/assets/images/fruit_11_merge.png',
        ]);
        Object.entries(textures).forEach((entry) => {
            this.textures.set(
                entry[0].split('./public/assets/images/')[1].split('.png')[0],
                new Texture(entry[1])
            );
        });
    }
}

export default GraphicController.getInstance();
