export class ConfigCheckUtils {


    public static checkNumberOrUndefined(name: string, number: string | number | undefined): number | undefined {
        if (number === null || number === undefined) {
            return undefined;
        } else if (isNaN(+number as any)) {
            throw new Error(`Cnofiguration ${name} is not a number: ` + number);
        }
        return +number;
    }

    public static checkNummerOrDefault(number: string | number | undefined, defaultNumber: number): number {
        if (number === null || number === undefined || isNaN(+number as any)) {
            return defaultNumber;
        }
        return +number;
    }


    public static checkBooleanDefaultFalse(value: boolean | undefined): boolean {
        if (value === undefined || value === null) {
            return false;
        }
        return value;
    }

    public static checkBooleanDefaultTrue(value: boolean | undefined): boolean {
        if (value === undefined || value === null) {
            return true;
        }
        return value;
    }

    public static checkString(value: string | undefined | null): string | undefined {
        if (value === undefined || value === null || value.trim() === '') {
            return undefined;
        }
        return value;
    }

}
