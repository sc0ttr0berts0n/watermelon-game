import { Application } from 'pixi.js';
import Objects from '../Utils/Objects';
import { PlayArea } from './PlayArea';
import Singleton from '../Utils/Singleton';
import PhysicsWorld from './Matter/PhysicsWorld';
import { Scoreboard } from './UI/Scoreboard';
import { FailBar } from './UI/FailBar';

class Game extends Singleton<Game>() {
    public app: Application | undefined;
    public gameover = false;
    public playArea: PlayArea | undefined;
    public counter = 0;

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
        this.app?.stage.addChild(new Scoreboard());
        this.app?.stage.addChild(new FailBar());
        this.playArea?.addFruit();
        document.addEventListener('gameover', () => {
            this.gameover = true;
        });
    }
}

export default Game.getInstance();
