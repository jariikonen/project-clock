/**
 * Represents the parameters based on which different time units are derived.
 */
export interface TimeParams {
  /** Length of day in hours. */
  day: number;

  /** Length of week in days. */
  week: number;

  /** Length of month in days. */
  month: number;

  /** Length of year in days. */
  year: number;
}

/**
 * A class that separates a time period given in milliseconds to day, hour,
 * minute, etc., parts.
 */
export default class TimePeriod {
  /**
   * Years part of the time period (i.e., the number of years in the time
   * period).
   */
  readonly years: number;

  /**
   * Months part of the time period (i.e., the number of months remaining
   * after subtracting years).
   */
  readonly months: number;

  /** Total number of months in the time period. */
  readonly monthsTotal: number;

  /**
   * Weeks part of the time period (i.e., the number of weeks remaining
   * after subtracting the months).
   */
  readonly weeks: number;

  /** Total number of weeks in the time period. */
  readonly weeksTotal: number;

  /**
   * Days part of the time period (i.e., the number of days remaining after
   * subtracting the weeks).
   */
  readonly days: number;

  /** Total number of days in the time period. */
  readonly daysTotal: number;

  /**
   * Hours part of the time period (i.e., the number of hours remaining after
   * subtracting the days).
   */
  readonly hours: number;

  /** Total number of hours in the time period. */
  readonly hoursTotal: number;

  /**
   * Minutes part of the time period (i.e., the number of minutes remaining
   * after subtracting the hours).
   */
  readonly minutes: number;

  /** Total number of minutes in the time period. */
  readonly minutesTotal: number;

  /**
   * Seconds part of the time period (i.e., the number of seconds remaining
   * after subtracting the minutes).
   */
  readonly seconds: number;

  /** Total number of seconds in the time period. */
  readonly secondsTotal: number;

  /**
   * Milliseconds part of the time period (i.e., the number of milliseconds
   * remaining after subtracting the seconds).
   */
  readonly milliseconds: number;

  /** Total number of milliseconds in the time period. */
  readonly millisecondsTotal: number;

  /**
   * The conversion rate parameters used between the variable time units (day,
   * week, month and year).
   */
  readonly timeParams: TimeParams;

  /** TimeParams for a Gregorian calendar time units. */
  static readonly timeParamsCalendar: TimeParams = {
    day: 24,
    week: 7,
    month: 365.2425 / 12,
    year: 365.2425,
  };

  /** TimeParams for typical work work hours. */
  static readonly timeParamsWork: TimeParams = {
    day: 8,
    week: 5,
    month: 20,
    year: 52 * 5,
  };

  /**
   * Constructs a new TimePeriod object.
   * @param milliseconds The time period in milliseconds.
   * @param timeParams The conversion rate parameters used for deriving days,
   *    weeks, months and years from smaller time units.
   */
  constructor(
    milliseconds: number,
    timeParams: TimeParams = TimePeriod.timeParamsWork
  ) {
    this.timeParams = timeParams;

    this.millisecondsTotal = milliseconds;
    this.secondsTotal = Math.floor(Math.abs(milliseconds) / 1000);
    this.minutesTotal = Math.floor(this.secondsTotal / 60);
    this.hoursTotal = Math.floor(this.minutesTotal / 60);

    const variableUnits = TimePeriod.#calculateTimes(timeParams, milliseconds);

    this.years = variableUnits.years;
    this.monthsTotal = variableUnits.monthsTotal;
    this.weeksTotal = variableUnits.weeksTotal;
    this.daysTotal = variableUnits.daysTotal;

    this.months = variableUnits.months;
    this.weeks = variableUnits.weeks;
    this.days = variableUnits.days;
    this.hours = variableUnits.hours;

    const millisecondsAfterVariableUnits =
      milliseconds - variableUnits.totalInMilliseconds;
    this.minutes = Math.floor(millisecondsAfterVariableUnits / 1000 / 60);
    this.seconds = Math.floor(
      (millisecondsAfterVariableUnits - this.minutes * 60 * 1000) / 1000
    );
    this.milliseconds = Math.floor(
      millisecondsAfterVariableUnits -
        this.minutes * 60 * 1000 -
        this.seconds * 1000
    );
  }

  static #calculateTimes(timeParams: TimeParams, milliseconds: number) {
    const hoursTotal = milliseconds / 1000 / 60 / 60;
    const asDays = hoursTotal / timeParams.day;
    const asWeeks = asDays / timeParams.week;
    const asMonths = asDays / timeParams.month;
    const years = Math.floor(asDays / timeParams.year);

    const daysMinusYears = asDays % timeParams.year;
    const months = Math.floor(daysMinusYears / timeParams.month);
    const daysMinusYearsMinusMonths = daysMinusYears % timeParams.month;
    const weeks = Math.floor(daysMinusYearsMinusMonths / timeParams.week);
    const daysMinusYearsMinusMonthsMinusWeeks =
      daysMinusYearsMinusMonths % timeParams.week;
    const days = Math.floor(daysMinusYearsMinusMonthsMinusWeeks);

    const daysWeeksMonthsYearsInHours =
      days * timeParams.day +
      weeks * timeParams.week * timeParams.day +
      months * timeParams.month * timeParams.day +
      years * timeParams.year * timeParams.day;
    const hours = Math.floor(hoursTotal - daysWeeksMonthsYearsInHours);

    const totalInMilliseconds =
      (daysWeeksMonthsYearsInHours + hours) * 60 * 60 * 1000;

    return {
      years,
      monthsTotal: Math.floor(asMonths),
      weeksTotal: Math.floor(asWeeks),
      daysTotal: Math.floor(asDays),
      months,
      weeks,
      days,
      hours,
      totalInMilliseconds,
    };
  }

  static #multiple(term: string, number: number) {
    return number !== 1 ? `${number} ${term}` : `1 ${term.slice(0, -1)}`;
  }

  #getNonNullKeys(includeSeconds = false) {
    const keysToCheck = [
      'years',
      'months',
      'weeks',
      'days',
      'hours',
      'minutes',
    ];
    if (includeSeconds) {
      keysToCheck.push('seconds');
    }
    return keysToCheck.filter((key) => (this[key] !== 0 ? this[key] : false));
  }

  #getNumValues(keys: string[]): Record<string, number> {
    const numValues = {};
    keys.forEach((key) => {
      if (typeof this[key] === 'number') {
        numValues[key] = this[key];
      } else {
        throw new Error(`value this[${key}] is not a number`);
      }
    });
    return numValues;
  }

  static #getAbbreviation(term: string) {
    switch (term) {
      case 'years':
        return 'y';
      case 'months':
        return 'mo';
      case 'weeks':
        return 'wk';
      case 'days':
      case 'daysTotal':
        return 'd';
      case 'hours':
      case 'hoursTotal':
        return 'h';
      case 'minutes':
        return 'min';
      case 'seconds':
        return 's';
      default:
        throw new Error(`switch ran out of options; unknown term '${term}'`);
    }
  }

  /**
   * Returns a string displaying the conversion rates between days and hours,
   * weeks and days, months and days and years and weeks.
   */
  conversionRatesStr() {
    return `d=${this.timeParams.day}h, wk=${this.timeParams.week}d, mo=${this.timeParams.month}d, y=${this.timeParams.year / this.timeParams.week}wk`;
  }

  /**
   * Returns a string displaying the conversion rate between days and hours.
   */
  conversionRateDayStr() {
    return `d=${this.timeParams.day}h`;
  }

  /**
   * Returns a string representing the time period parts in a long
   * human-readable format.
   * @param includeSeconds The output also includes seconds if true.
   * @returns A long human-readable string.
   */
  longStr(includeSeconds = false) {
    const nonNullKeys = this.#getNonNullKeys(includeSeconds);
    const numValues = this.#getNumValues(nonNullKeys);
    const strings = nonNullKeys.map((key, i) => {
      if (i < nonNullKeys.length - 2) {
        return `${TimePeriod.#multiple(key, numValues[key])}, `;
      }
      if (i === nonNullKeys.length - 2) {
        return `${TimePeriod.#multiple(key, numValues[key])} and `;
      }
      return `${TimePeriod.#multiple(key, numValues[key])}`;
    });
    return strings.join('');
  }

  /**
   * Returns a string representing the time period in a shorter human-readable
   * format.
   * @param includeSeconds The output also includes seconds if true.
   * @returns A shorter human-readable string.
   */
  shortStr(includeSeconds = false) {
    const nonNullKeys = this.#getNonNullKeys(includeSeconds);
    const strings = nonNullKeys.map((key, i) => {
      if (i < nonNullKeys.length - 2) {
        return `${this[key]} ${TimePeriod.#getAbbreviation(key)}, `;
      }
      if (i === nonNullKeys.length - 2) {
        return `${this[key]} ${TimePeriod.#getAbbreviation(key)} and `;
      }
      return `${this[key]} ${TimePeriod.#getAbbreviation(key)}`;
    });
    return strings.join('');
  }

  /**
   * Returns a string representing the time period in a human-readable format
   * that takes up as little space as possible.
   * @param includeSeconds The output also includes seconds if true.
   * @returns A human-readable string that takes as little space as possible.
   */
  narrowStr(includeSeconds = false) {
    const nonNullKeys = this.#getNonNullKeys(includeSeconds);
    const strings = nonNullKeys.map(
      (key) => `${this[key]}${TimePeriod.#getAbbreviation(key)}`
    );
    return strings.join(' ');
  }

  /**
   * Returns a string representing the time period in a format similae to
   * a digital clock.
   * @param includeSeconds The output also includes seconds if true.
   * @returns A string representing the time period in a format similar to
   *    a digital clock.
   */
  digitalStr(includeSeconds = false) {
    const keys = ['years', 'months', 'weeks', 'days', 'hours', 'minutes'];
    if (includeSeconds) {
      keys.push('seconds');
    }
    const strings = keys.map((key) => `${this[key]}`.padStart(2, '0'));
    return strings.join(':');
  }

  /**
   * Returns a string representing the time period in hours and minutes.
   * @param includeSeconds The output also includes seconds if true.
   * @returns A string representing the time period in hours and minutes.
   */
  hoursAndMinutesStr(includeSeconds = false) {
    const keysToCheck = ['hoursTotal', 'minutes'];
    if (includeSeconds) {
      keysToCheck.push('seconds');
    }
    const nonNullKeys = keysToCheck.filter((key) =>
      this[key] !== 0 ? this[key] : false
    );
    const strings = nonNullKeys.map(
      (key) => `${this[key]}${TimePeriod.#getAbbreviation(key)}`
    );
    return strings.join(' ');
  }

  /**
   * Returns a string representing the time period in days hours and minutes.
   * @param includeSeconds The output also includes seconds if true.
   * @returns A string representing the time period in days hours and minutes.
   */
  daysHoursAndMinutesStr(includeSeconds = false) {
    const keysToCheck = ['daysTotal', 'hours', 'minutes'];
    if (includeSeconds) {
      keysToCheck.push('seconds');
    }
    const nonNullKeys = keysToCheck.filter((key) =>
      this[key] !== 0 ? this[key] : false
    );
    const strings = nonNullKeys.map(
      (key) => `${this[key]}${TimePeriod.#getAbbreviation(key)}`
    );
    return strings.join(' ');
  }
}
