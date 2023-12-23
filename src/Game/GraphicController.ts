import { Assets, Texture } from 'pixi.js';
import Singleton from '../Utils/Singleton';

class GraphicController extends Singleton<GraphicController>() {
    public textures: Map<string, Texture> = new Map();
    async init() {
        const textures = await Assets.load([
            '/assets/images/fruit_1_r.png',
            '/assets/images/fruit_1_s.png',
            '/assets/images/fruit_2_merge.png',
            '/assets/images/fruit_2_r.png',
            '/assets/images/fruit_2_s.png',
            '/assets/images/fruit_3_merge.png',
            '/assets/images/fruit_3_r.png',
            '/assets/images/fruit_3_s.png',
            '/assets/images/fruit_4_merge.png',
            '/assets/images/fruit_4_r.png',
            '/assets/images/fruit_4_s.png',
            '/assets/images/fruit_5_merge.png',
            '/assets/images/fruit_5_r.png',
            '/assets/images/fruit_5_s.png',
            '/assets/images/fruit_6_merge.png',
            '/assets/images/fruit_6_r.png',
            '/assets/images/fruit_6_s.png',
            '/assets/images/fruit_7_merge.png',
            '/assets/images/fruit_7_r.png',
            '/assets/images/fruit_7_s.png',
            '/assets/images/fruit_8_merge.png',
            '/assets/images/fruit_8_r.png',
            '/assets/images/fruit_8_s.png',
            '/assets/images/fruit_9_merge.png',
            '/assets/images/fruit_9_r.png',
            '/assets/images/fruit_9_s.png',
            '/assets/images/fruit_10_merge.png',
            '/assets/images/fruit_10_r.png',
            '/assets/images/fruit_10_s.png',
            '/assets/images/fruit_11_merge.png',
        ]);
        Object.entries(textures).forEach((entry) => {
            this.textures.set(
                entry[0].split('/assets/images/')[1].split('.png')[0],
                new Texture(entry[1])
            );
        });
    }
}

export default GraphicController.getInstance();
