export class CardColors {
    roseLines: string;
    roseDirectionLetters: string;
    roseCenterPercentage: string;
    rosePercentages: string;
    roseCurrentDirectionArrow: string;
    barBorder: string;
    barUnitName: string;
    barName: string
    barUnitValues: string
    barPercentages: string;

    constructor() {
        const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-text-color');
        this.roseLines = 'rgb(160, 160, 160)';
        this.roseDirectionLetters = primaryColor;
        this.roseCenterPercentage = 'auto';
        this.rosePercentages = primaryColor;
        this.roseCurrentDirectionArrow = 'red';
        this.barBorder = 'rgb(160, 160, 160)';
        this.barUnitName = primaryColor;
        this.barName = primaryColor;
        this.barUnitValues = primaryColor;
        this.barPercentages = 'auto';
    }
}
