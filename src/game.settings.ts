import Victor from 'victor';

export default {
    global: {
        tiers: 10,
        maxSpawnTier: 5,
    },
    fruit: {
        minSize: 30,
        maxSize: 200,
    },
    playArea: {
        size: new Victor(800, 1000),
        wallWidth: 100,
        gravity: new Victor(0, 1),
    },
    failBar: {
        size: new Victor(800, 200),
        heatIncreaseRate: 0.001,
        heatDecreaseRate: 0.01,
        minAge: 60,
    },
    localStorageController: {
        namespace: 'SRMelonGame',
    },
} as const;
