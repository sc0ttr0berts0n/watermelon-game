import { Container, Text } from 'pixi.js';
import Objects from '../../Utils/Objects';
import LocalStorageController from '../../Utils/LocalStorageController';

const fontStyleObject = {
    fill: 0xffffff,
    fontSize: 40,
    fontFamily: 'monospace',
};

export class Scoreboard extends Container {
    private score = 0;
    private pb = parseInt(LocalStorageController.get('pb') ?? '0');
    private txt_scoreLabel = new Text('Score: ', fontStyleObject);
    private txt_scoreValue = new Text(this.score.toString(), fontStyleObject);
    private txt_highScoreLabel = new Text('PB: ', fontStyleObject);
    private txt_highScoreValue = new Text(this.pb, fontStyleObject);

    constructor() {
        super();
        Objects.set('Scoreboard', this);
        this.addChild(this.txt_scoreLabel);
        this.addChild(this.txt_scoreValue);
        this.addChild(this.txt_highScoreLabel);
        this.addChild(this.txt_highScoreValue);
        this.txt_scoreValue.x = this.txt_scoreLabel.width;
        this.txt_highScoreLabel.y = this.txt_scoreLabel.height;
        this.txt_highScoreValue.y = this.txt_scoreLabel.height;
        this.txt_highScoreValue.x = this.txt_highScoreLabel.width;
        this.x = 15;
        this.y = 15;
    }

    add(points: number) {
        this.score += points;
        this.txt_scoreValue.text = this.score.toString();
        if (this.score > this.pb) {
            this.pb = this.score;
            this.txt_highScoreValue.text = this.pb.toString();
            LocalStorageController.set('pb', this.pb.toString());
        }
    }
}
