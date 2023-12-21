export const wait = (durationInMS: number): Promise<void> => {
    return new Promise((resolve) => setTimeout(resolve, durationInMS));
};
