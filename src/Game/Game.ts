import { Application } from 'pixi.js';
import Objects from '../Utils/Objects';
import { PlayArea } from './PlayArea';
import Singleton from '../Utils/Singleton';
import PhysicsWorld from './Matter/PhysicsWorld';
import { Scoreboard } from './Scoreboard/Scoreboard';
import pjson from '../../package.json';

class Game extends Singleton<Game>() {
    public app: Application | undefined;
    private playArea: PlayArea | undefined;
    private scoreboard: Scoreboard | undefined;
    private version = pjson.version;

    constructor() {
        super();
    }

    init() {
        this.app = new Application({ width: 800, height: 1200 });
        document
            .querySelector<HTMLDivElement>('#app')!
            // @ts-expect-error
            .appendChild(this.app.view);
        Objects.set('app', this.app.stage);
        Objects.set('stage', this.app.stage);

        // hook for devtools:
        (globalThis as any).__PIXI_APP__ = this.app;

        PhysicsWorld.init();

        this.create();
    }

    create() {
        this.playArea = this.app?.stage.addChild(new PlayArea());
        this.scoreboard = this.app?.stage.addChild(new Scoreboard());
        Objects.get<PlayArea>('PlayArea').addFruit();
    }
}

export default Game.getInstance();
