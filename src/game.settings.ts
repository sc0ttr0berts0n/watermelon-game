import Victor from 'victor';

export default {
    playArea: {
        size: new Victor(800, 1000),
        wallWidth: 100,
        gravity: new Victor(0, 1),
    },
} as const;
