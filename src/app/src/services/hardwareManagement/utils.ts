const IS_PROPIETARY_HARDWARE = process.env.DC2_HARDWARE === 'rpi';

export function isPropietaryHardware(): boolean {
    if (IS_PROPIETARY_HARDWARE) {
        return true;
    }
    return false;
}