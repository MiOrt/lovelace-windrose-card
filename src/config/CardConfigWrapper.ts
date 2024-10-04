import {GlobalConfig} from "./GlobalConfig";
import {CardConfig} from "../card/CardConfig";
import {SpeedRange} from "../converter/SpeedRange";
import {CardColors} from "./CardColors";
import {Log} from "../util/Log";
import {WindSpeedEntity} from "./WindSpeedEntity";
import {WindDirectionEntity} from "./WindDirectionEntity";
import {DataPeriod} from "./DataPeriod";
import {CardConfigDataPeriod} from "../card/CardConfigDataPeriod";
import {CompassConfig} from "./CompassConfig";
import {CardConfigCompass} from "../card/CardConfigCompass";
import {CurrentDirectionConfig} from "./CurrentDirectionConfig";
import {CornersInfo} from "./CornersInfo";
import {ConfigCheckUtils} from "./ConfigCheckUtils";


export class CardConfigWrapper {

    title: string;
    dataPeriod: DataPeriod;
    refreshInterval: number;
    windDirectionEntity: WindDirectionEntity;
    windspeedEntities: WindSpeedEntity[];
    windspeedBarLocation: string;
    windspeedBarFull: boolean;
    hideWindspeedBar: boolean;
    centerCalmPercentage: boolean;
    cardinalDirectionLetters: string;
    windDirectionCount: number;
    windRoseDrawNorthOffset: number;
    currentDirection: CurrentDirectionConfig;
    outputSpeedUnit: string;
    outputSpeedUnitLabel: string | undefined;
    speedRangeBeaufort: boolean;
    speedRangeStep: number | undefined;
    speedRangeMax: number | undefined;
    speedRanges: SpeedRange[] = [];
    matchingStrategy: string;
    cardColor: CardColors;
    compassConfig: CompassConfig;
    cornersInfo: CornersInfo;
    logLevel: string;

    filterEntitiesQueryParameter: string;

    static exampleConfig(): Record<string, unknown>  {
        return {
            title: 'Wind direction',
            data_period: {
                hours_to_show: GlobalConfig.defaultHoursToShow
            },
            refresh_interval: GlobalConfig.defaultRefreshInterval,
            windspeed_bar_location: GlobalConfig.defaultWindspeedBarLocation,
            windspeed_bar_full: GlobalConfig.defaultWindspeedBarFull,
            wind_direction_entity: {
                entity: '',
                use_statistics: false,
                direction_compensation: 0
            },
            windspeed_entities: [
                {
                    entity: '',
                    name: '',
                    speed_unit: GlobalConfig.defaultInputSpeedUnit,
                    use_statistics: false
                }
            ],
            output_speed_unit: GlobalConfig.defaultOutputSpeedUnit,
            speed_range_beaufort: GlobalConfig.defaultSpeedRangeBeaufort,
            speed_range_step: undefined,
            speed_range_max: undefined,
            speed_ranges: undefined,
            windrose_draw_north_offset: 0,
            current_direction: {
                show_arrow: false,
                arrow_size: 50,
                center_circle_size: 30
            },
            compass_direction: {
                auto_rotate: false,
                entity: ''
            },
            cardinal_direction_letters: GlobalConfig.defaultCardinalDirectionLetters,
            matching_strategy: GlobalConfig.defaultMatchingStategy,
            center_calm_percentage: GlobalConfig.defaultCenterCalmPercentage,
            log_level: GlobalConfig.defaultLogLevel
        };
    }

    constructor(private readonly cardConfig: CardConfig) {
        this.title = this.cardConfig.title;
        this.dataPeriod = this.checkDataPeriod(cardConfig.hours_to_show, cardConfig.data_period);
        this.refreshInterval = this.checkRefreshInterval();
        this.windDirectionEntity = this.checkWindDirectionEntity();
        this.windspeedEntities = this.checkWindspeedEntities();
        this.windRoseDrawNorthOffset = this.checkwindRoseDrawNorthOffset();
        this.currentDirection = this.checkCurrentDirection()
        this.windspeedBarLocation = this.checkWindspeedBarLocation();
        this.windspeedBarFull = ConfigCheckUtils.checkBooleanDefaultTrue(cardConfig.windspeed_bar_full);
        this.hideWindspeedBar = ConfigCheckUtils.checkBooleanDefaultFalse(cardConfig.hide_windspeed_bar);
        this.centerCalmPercentage = ConfigCheckUtils.checkBooleanDefaultTrue(cardConfig.center_calm_percentage);
        this.cardinalDirectionLetters = this.checkCardinalDirectionLetters();
        this.windDirectionCount = this.checkWindDirectionCount();
        this.outputSpeedUnit = this.checkOutputSpeedUnit();
        this.outputSpeedUnitLabel = this.checkOutputSpeedUnitLabel();
        this.speedRangeBeaufort = ConfigCheckUtils.checkBooleanDefaultTrue(cardConfig.speed_range_beaufort);
        this.speedRangeStep = this.checkSpeedRangeStep();
        this.speedRangeMax = this.checkSpeedRangeMax();
        this.speedRanges = this.checkSpeedRanges();
        this.checkSpeedRangeCombi();
        this.matchingStrategy = this.checkMatchingStrategy();
        this.filterEntitiesQueryParameter = this.createEntitiesQueryParameter();
        this.cardColor = this.checkCardColors();
        this.compassConfig = this.checkCompassConfig(cardConfig.compass_direction);
        this.cornersInfo = CornersInfo.create(cardConfig.corner_info);
        this.logLevel = Log.checkLogLevel(this.cardConfig.log_level);
        Log.info('Config check OK');
    }

    windBarCount(): number {
        if (this.hideWindspeedBar) {
            return 0;
        }
        return this.windspeedEntities.length;
    }

    private checkDataPeriod(oldHoursToShow: number, dataPeriod: CardConfigDataPeriod): DataPeriod {
        const oldHoursToShowCheck = this.checkHoursToShow(oldHoursToShow);
        const hoursToShowCheck = this.checkHoursToShow(dataPeriod?.hours_to_show);
        const fromHourOfDayCheck = this.checkFromHourOfDay(dataPeriod?.from_hour_of_day);
        if (oldHoursToShowCheck) {
            Log.warn('WindRoseCard: hours_to_show config is deprecated, use the data_period object.');
            return new DataPeriod(oldHoursToShow, undefined);
        }
        if (hoursToShowCheck && fromHourOfDayCheck) {
            throw new Error('WindRoseCard: Only one is allowed: hours_to_show or from_hour_of_day');
        }
        if (!hoursToShowCheck && !fromHourOfDayCheck) {
            throw new Error('WindRoseCard: One config option object data_period should be filled.');
        }
        return new DataPeriod(dataPeriod.hours_to_show, dataPeriod.from_hour_of_day);
    }

    private checkHoursToShow(hoursToShow: number): boolean {
        if (hoursToShow && isNaN(hoursToShow) ) {
            throw new Error('WindRoseCard: Invalid hours_to_show, should be a number above 0.');
        } else if (hoursToShow) {
            return true
        }
        return false;
    }

    private checkFromHourOfDay(fromHourOfDay: number): boolean {
        if (fromHourOfDay && (isNaN(fromHourOfDay) || fromHourOfDay < 0 || fromHourOfDay > 23)) {
            throw new Error('WindRoseCard: Invalid hours_to_show, should be a number between 0 and 23, hour of the day..');
        } else if (fromHourOfDay != null && fromHourOfDay >= 0) {
            return true
        }
        return false;
    }

    private checkRefreshInterval(): number {
        if (this.cardConfig.refresh_interval && isNaN(this.cardConfig.refresh_interval)) {
            throw new Error('WindRoseCard: Invalid refresh_interval, should be a number in seconds.');
        } else if (this.cardConfig.refresh_interval) {
            return this.cardConfig.refresh_interval;
        }
        return GlobalConfig.defaultRefreshInterval;
    }

    private checkWindDirectionEntity(): WindDirectionEntity {
        if (this.cardConfig.wind_direction_entity) {
            const entityConfig = this.cardConfig.wind_direction_entity;
            if (entityConfig.entity === undefined) {
                throw new Error("WindRoseCard: No wind_direction_entity.entity configured.");
            }
            const entity = entityConfig.entity;
            const useStatistics = ConfigCheckUtils.checkBooleanDefaultFalse(entityConfig.use_statistics);
            const directionCompensation = this.checkDirectionCompensation(entityConfig.direction_compensation);
            const directionLetters = this.checkDirectionLetters(entityConfig.direction_letters);
            return new WindDirectionEntity(entity, useStatistics, directionCompensation, directionLetters);
        }
        throw new Error("WindRoseCard: No wind_direction_entity configured.");
    }

    private checkCurrentDirection(): CurrentDirectionConfig {
        if (this.cardConfig.current_direction) {
            return new CurrentDirectionConfig(
                ConfigCheckUtils.checkBooleanDefaultFalse(this.cardConfig.current_direction.show_arrow),
                ConfigCheckUtils.checkNummerOrDefault(this.cardConfig.current_direction.arrow_size, GlobalConfig.defaultCurrentDirectionArrowSize),
                ConfigCheckUtils.checkNummerOrDefault(this.cardConfig.current_direction.center_circle_size, GlobalConfig.defaultCurrentDirectionCircleSize)
            )
        }
        return new CurrentDirectionConfig(false, undefined, undefined);
    }

    private checkWindspeedEntities(): WindSpeedEntity[] {
        if (!this.cardConfig.windspeed_entities || this.cardConfig.windspeed_entities.length == 0) {
            throw new Error('WindRoseCard: No wind_speed_entities configured, minimal 1 needed.');
        }
        const entities:WindSpeedEntity[] = [];
        for (const entityConfig of this.cardConfig.windspeed_entities) {
            const entity = entityConfig.entity;
            const name = entityConfig.name;
            const useStatistics = ConfigCheckUtils.checkBooleanDefaultFalse(entityConfig.use_statistics);
            const inputSpeedUnit = this.checkInputSpeedUnit(entityConfig.speed_unit);
            const renderRelativeScale = ConfigCheckUtils.checkBooleanDefaultTrue(entityConfig.render_relative_scale);
            entities.push(new WindSpeedEntity(entity, name, useStatistics, renderRelativeScale, inputSpeedUnit))
        }
        return entities;
    }

    private checkInputSpeedUnit(inputSpeedUnit: string): string {
        if (inputSpeedUnit) {
            if (inputSpeedUnit !== 'mps'
                && inputSpeedUnit !== 'bft'
                && inputSpeedUnit !== 'kph'
                && inputSpeedUnit !== 'mph'
                && inputSpeedUnit !== 'fps'
                && inputSpeedUnit !== 'knots'
                && inputSpeedUnit !== 'auto') {
                throw new Error('Invalid windspeed unit configured: ' + inputSpeedUnit +
                    '. Valid options: mps, bft, fps, kph, mph, knots, auto');
            }
            return inputSpeedUnit;
        }
        return GlobalConfig.defaultInputSpeedUnit;
    }

    private checkDirectionCompensation(directionCompensation: number): number {
        if (directionCompensation && isNaN(directionCompensation)) {
            throw new Error('WindRoseCard: Invalid direction compensation, should be a number in degress between 0 and 360.');
        } else if (directionCompensation) {
            return directionCompensation;
        }
        return 0;
    }

    private checkDirectionLetters(directionLetters: string): string | undefined {
        if (directionLetters) {

            if (directionLetters && directionLetters.length === 5) {
                return directionLetters.toUpperCase();
            } else {
                throw new Error('WindRoseCard: direction_letters config should be 5 letters.');
            }
        }
        return undefined;
    }

    private checkwindRoseDrawNorthOffset(): number {
        if (this.cardConfig.windrose_draw_north_offset && isNaN(this.cardConfig.windrose_draw_north_offset)) {
            throw new Error('WindRoseCard: Invalid render direction offset, should be a number in degress between 0 and 360.');
        } else if (this.cardConfig.windrose_draw_north_offset) {
            return this.cardConfig.windrose_draw_north_offset;
        }
        return 0;
    }

    private checkWindspeedBarLocation(): string {
        if (this.cardConfig.windspeed_bar_location) {
            if (this.cardConfig.windspeed_bar_location !== 'bottom' && this.cardConfig.windspeed_bar_location !== 'right') {
                throw new Error('Invalid windspeed bar location ' + this.cardConfig.windspeed_bar_location +
                    '. Valid options: bottom, right');
            }
            return this.cardConfig.windspeed_bar_location;
        }
        return GlobalConfig.defaultWindspeedBarLocation;
    }


    private checkCardinalDirectionLetters(): string {
        if (this.cardConfig.cardinal_direction_letters) {
            if (this.cardConfig.cardinal_direction_letters.length !== 4) {
                throw new Error("Cardinal direction letters option should contain 4 letters.");
            }
            return this.cardConfig.cardinal_direction_letters;
        }
        return GlobalConfig.defaultCardinalDirectionLetters;
    }

    private checkWindDirectionCount(): number {
        if (this.cardConfig.wind_direction_count) {
            if (isNaN(this.cardConfig.wind_direction_count) || this.cardConfig.wind_direction_count < 4 ||
                    this.cardConfig.wind_direction_count > 32) {
                throw new Error("Wind direction count can a number between 4 and 32");
            }
            return this.cardConfig.wind_direction_count;
        }
        return GlobalConfig.defaultWindDirectionCount;
    }

    private checkOutputSpeedUnit(): string {
        if (this.cardConfig.output_speed_unit) {
            if (this.cardConfig.output_speed_unit !== 'mps'
                && this.cardConfig.output_speed_unit !== 'kph'
                && this.cardConfig.output_speed_unit !== 'mph'
                && this.cardConfig.output_speed_unit !== 'fps'
                && this.cardConfig.output_speed_unit !== 'knots') {
                throw new Error('Invalid output windspeed unit configured: ' + this.cardConfig.output_speed_unit +
                    '. Valid options: mps, fps, kph, mph, knots');
            }
            return this.cardConfig.output_speed_unit;
        }
        return GlobalConfig.defaultOutputSpeedUnit;
    }

    private checkOutputSpeedUnitLabel(): string | undefined {
        if (this.cardConfig.output_speed_unit_label) {
            return this.cardConfig.output_speed_unit_label
        }
        return undefined;
    }

    private checkSpeedRangeStep(): number | undefined {
        if (this.cardConfig.speed_range_step && isNaN(this.cardConfig.speed_range_step)) {
            throw new Error('WindRoseCard: Invalid speed_range_step, should be a positive number.');
        } else if (this.cardConfig.speed_range_step <= 0) {
            throw new Error('WindRoseCard: Invalid speed_range_step, should be a positive number.')
        } else if (this.cardConfig.speed_range_step) {
            return this.cardConfig.speed_range_step;
        }
        return undefined;
    }

    private checkSpeedRangeMax(): number | undefined {
        if (this.cardConfig.speed_range_max && isNaN(this.cardConfig.speed_range_max)) {
            throw new Error('WindRoseCard: Invalid speed_range_max, should be a positive number.');
        } else if (this.cardConfig.speed_range_max <= 0) {
            throw new Error('WindRoseCard: Invalid speed_range_max, should be a positive number.')
        } else if (this.cardConfig.speed_range_max) {
            return this.cardConfig.speed_range_max;
        }
        return undefined;
    }

    private checkSpeedRanges(): SpeedRange[] {
        const speedRangeConfigs: SpeedRange[] = [];
        if (this.cardConfig.speed_ranges && this.cardConfig.speed_ranges.length > 0) {
            const sortSpeedRanges = this.cardConfig.speed_ranges.slice();
            sortSpeedRanges.sort((a, b) => a.from_value - b.from_value)
            const lastIndex = sortSpeedRanges.length - 1;
            for (let i = 0; i < lastIndex; i++) {
                speedRangeConfigs.push(new SpeedRange(i,
                    sortSpeedRanges[i].from_value,
                    sortSpeedRanges[i + 1].from_value,
                    sortSpeedRanges[i].color));
            }
            speedRangeConfigs.push(new SpeedRange(lastIndex,
                sortSpeedRanges[lastIndex].from_value,
                -1,
                sortSpeedRanges[lastIndex].color))
        }
        return speedRangeConfigs;
    }

    private checkSpeedRangeCombi(): void {
        if (this.outputSpeedUnit === 'bft' && (this.speedRangeStep || this.speedRangeMax)) {
            throw new Error("WindRoseCard: speed_range_step and/or speed_range_max should not be set when using output " +
                "speed unit Beaufort (bft). Beaufort uses fixed speed ranges.");
        }
        if ((this.speedRangeStep && !this.speedRangeMax) || (!this.speedRangeStep && this.speedRangeMax)) {
            throw new Error("WindRoseCard: speed_range_step and speed_range_max should both be set.")
        }
    }

    private checkMatchingStrategy(): string {
        if (this.cardConfig.matching_strategy) {
            if (this.cardConfig.matching_strategy !== 'direction-first' && this.cardConfig.matching_strategy !== 'speed-first') {
                throw new Error('Invalid matching stategy ' + this.cardConfig.matching_strategy +
                    '. Valid options: direction-first, speed-first');
            }
            return this.cardConfig.matching_strategy;
        }
        return GlobalConfig.defaultMatchingStategy;
    }

    private createEntitiesQueryParameter() {
        return this.windDirectionEntity + ',' + this.windspeedEntities
            .map(config => config.entity)
            .join(',');
    }

    private checkCompassConfig(compassDirection: CardConfigCompass | undefined): CompassConfig {
        let entity = undefined;
        let autoRotate = false;
        if (compassDirection) {
            autoRotate = ConfigCheckUtils.checkBooleanDefaultFalse(compassDirection.auto_rotate);
            if (autoRotate) {
                if (compassDirection.entity) {
                    entity = compassDirection.entity;
                } else {
                    throw new Error('WindRoseCard: compass direction auto rotate set to true, but no entity configured.');
                }
            }
        }
       return new CompassConfig(autoRotate, entity);
    }

    createRawEntitiesArray(): string[] {
        const entities: string[] = [];
        if (!this.windDirectionEntity.useStatistics) {
            entities.push(this.windDirectionEntity.entity);
        }
        return entities.concat(this.windspeedEntities.filter(config => !config.useStatistics).map(config => config.entity));
    }

    createStatisticsEntitiesArray(): string[] {
        const entities: string[] = [];
        if (this.windDirectionEntity.useStatistics) {
            entities.push(this.windDirectionEntity.entity);
        }
        return entities.concat(this.windspeedEntities.filter(config => config.useStatistics).map(config => config.entity));
    }

    private checkCardColors(): CardColors {
        const cardColors = new CardColors();
        if (this.cardConfig.colors) {
            if (this.cardConfig.colors.rose_direction_letters) {
                cardColors.roseDirectionLetters = this.cardConfig.colors.rose_direction_letters;
            }
            if (this.cardConfig.colors.rose_lines) {
                cardColors.roseLines = this.cardConfig.colors.rose_lines;
            }
            if (this.cardConfig.colors.rose_percentages) {
                cardColors.rosePercentages = this.cardConfig.colors.rose_percentages;
            }
            if (this.cardConfig.colors.rose_center_percentage) {
                cardColors.roseCenterPercentage = this.cardConfig.colors.rose_center_percentage;
            }
            if (this.cardConfig.colors.rose_current_direction_arrow) {
                cardColors.roseCurrentDirectionArrow = this.cardConfig.colors.rose_current_direction_arrow
            }
            if (this.cardConfig.colors.bar_border) {
                cardColors.barBorder = this.cardConfig.colors.bar_border;
            }
            if (this.cardConfig.colors.bar_name) {
                cardColors.barName = this.cardConfig.colors.bar_name;
            }
            if (this.cardConfig.colors.bar_percentages) {
                cardColors.barPercentages = this.cardConfig.colors.bar_percentages;
            }
            if (this.cardConfig.colors.bar_unit_name) {
                cardColors.barUnitName = this.cardConfig.colors.bar_unit_name;
            }
            if (this.cardConfig.colors.bar_unit_values) {
                cardColors.barUnitValues = this.cardConfig.colors.bar_unit_values;
            }
        }
        return cardColors;
    }

}
