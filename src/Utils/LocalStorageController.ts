import Singleton from './Singleton';
import pjson from '../../package.json';
import gameSettings from '../game.settings';

class LocalStorageController extends Singleton<LocalStorageController>() {
    private prefix = `${gameSettings.localStorageController.namespace}_${pjson.version}_`;
    constructor() {
        super();
    }
    get(key: string): string | null {
        return window.localStorage.getItem(`${this.prefix}${key}`);
    }
    set(key: string, value: string) {
        window.localStorage.setItem(`${this.prefix}${key}`, value);
    }
}

export default LocalStorageController.getInstance();
