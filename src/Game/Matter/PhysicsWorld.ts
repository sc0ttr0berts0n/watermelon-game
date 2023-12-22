import Matter, { Bodies, Composite } from 'matter-js';
import Singleton from '../../Utils/Singleton';
import { Fruit } from '../Fruit/Fruit';
import gameSettings from '../../game.settings';

const {
    playArea: { wallWidth, size },
} = gameSettings;

class PhysicsWorld extends Singleton<PhysicsWorld>() {
    private walls = [
        // left
        Matter.Bodies.rectangle(
            -wallWidth / 2,
            (size.y + wallWidth) / 2,
            wallWidth,
            size.y + wallWidth,
            {
                isStatic: true,
            }
        ),
        // right
        Matter.Bodies.rectangle(
            size.x + wallWidth / 2,
            (size.y + wallWidth) / 2,
            wallWidth,
            size.y + wallWidth,
            {
                isStatic: true,
            }
        ),
    ];
    private ground = Matter.Bodies.rectangle(
        (size.x + wallWidth) / 2,
        size.y + wallWidth / 2,
        size.x + wallWidth * 2,
        wallWidth,
        {
            isStatic: true,
        }
    );

    private engine = Matter.Engine.create();
    private runner = Matter.Runner.create();

    constructor() {
        super();
    }

    init() {
        // add all of the bodies to the world
        Composite.add(this.engine.world, [...this.walls, this.ground]);

        // run the engine
        Matter.Runner.run(this.runner, this.engine);
    }

    addFruitBody(fruit: Fruit): Matter.Body {
        const {
            pos: { x, y },
            radius,
        } = fruit;
        const body = Bodies.circle(x, y, radius);
        fruit.setBody(body);
        Matter.Composite.add(this.engine.world, body);

        console.log(`Add: ${this.engine.world.bodies.length}`);

        return body;
    }

    removeFruitBody(body: Matter.Body | null) {
        if (!body) return console.warn('Body was null');
        Matter.Composite.remove(this.engine.world, body);
        console.log(`Rem: ${this.engine.world.bodies.length}`);
    }
}
export default PhysicsWorld.getInstance();
