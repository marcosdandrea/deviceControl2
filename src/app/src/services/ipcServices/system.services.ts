export const getSystemTime = (_data: null, cb: Function) => {
    cb({ time: new Date().toISOString() });
}