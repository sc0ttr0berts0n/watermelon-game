import { Container } from 'pixi.js';
import Singleton from './Singleton';

class Objects extends Singleton<Objects>() {
    private objects: Map<string, Container> = new Map();
    constructor() {
        super();
        // Private constructor to prevent instantiation
    }

    get<T>(string: string) {
        return this.objects.get(string) as T;
    }

    set(string: string, val: Container) {
        this.objects.set(string, val);
    }
    // Other methods or properties can be added here
}

export default Objects.getInstance();
