export default class MathHelper {
    static clamp = (min: number, max: number, val: number): number => {
        return Math.max(Math.min(max, val), min);
    };
}
