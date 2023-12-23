import { Application } from 'pixi.js';
import Objects from '../Utils/Objects';
import { PlayArea } from './PlayArea';
import Singleton from '../Utils/Singleton';
import PhysicsWorld from './Matter/PhysicsWorld';
import { Scoreboard } from './UI/Scoreboard';
import { FailBar } from './UI/FailBar';
import GraphicController from './GraphicController';
import { ScoreStrip } from './UI/ScoreStrip';
import gameSettings from '../game.settings';
import { NextTier } from './UI/NextTier';
import { Instructions } from './UI/Instructions';

class Game extends Singleton<Game>() {
    public app: Application | undefined;
    public gameover = false;
    public playArea: PlayArea | undefined;
    public counter = 0;
    public tierCounts: Map<number, number> = new Map();
    public nextTier = this.randomTier();
    public get fetchTier() {
        const prev = this.nextTier;
        this.nextTier = this.randomTier();
        Objects.get<NextTier>('NextTier').redraw();
        return prev;
    }

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

    async create() {
        await GraphicController.init();
        this.playArea = this.app?.stage.addChild(new PlayArea());
        this.app?.stage.addChild(new Scoreboard());
        this.app?.stage.addChild(new ScoreStrip());
        this.app?.stage.addChild(new NextTier());
        this.app?.stage.addChild(new FailBar());
        this.app?.stage.addChild(new Instructions());
        this.playArea?.addFruit();
        document.addEventListener('gameover', () => {
            this.gameover = true;
        });
    }

    randomTier() {
        return Math.floor(Math.random() * gameSettings.global.maxSpawnTier);
    }
}

export default Game.getInstance();
