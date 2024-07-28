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

  constructor(milliseconds: number) {
    const secs = Math.floor(Math.abs(milliseconds) / 1000);
    const mins = Math.floor(secs / 60);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);
    const months = Math.floor(days / (365.2425 / 12)); // the mean length of Gregorian year is 365.2425 days
    const years = Math.floor(days / 365.2425);
    const millisecs = Math.floor(Math.abs(milliseconds)) % 1000;
    const millisecsTotal = milliseconds;

    this.years = years;
    this.months = months % 12;
    this.monthsTotal = months;
    this.weeks = weeks % 4;
    this.weeksTotal = weeks;
    this.days = days % 7;
    this.daysTotal = days;
    this.hours = hours % 24;
    this.hoursTotal = hours;
    this.minutes = mins % 60;
    this.minutesTotal = mins;
    this.seconds = secs % 60;
    this.secondsTotal = secs;
    this.milliseconds = millisecs;
    this.millisecondsTotal = millisecsTotal;
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
        return 'd';
      case 'hours':
      case 'hoursTotal':
        return 'h';
      case 'minutes':
        return 'min';
      case 'seconds':
        return 's';
      default:
        throw new Error(`unknown term '${term}'`);
    }
  }

  /**
   * Returns a string representing the time period parts in a long
   * human-readable format.
   * @param includeSeconds Outputs also the seconds part.
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
   * @param includeSeconds Outputs also the seconds if true.
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
   * @param includeSeconds Outputs also the seconds if true.
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
   * @param includeSeconds Ouputs also the seconds if true.
   * @returns A string representing the time period in a format similar to
   *    a digital clock.
   */
  digitalStr(includeSeconds = false) {
    const keys = ['years', 'months', 'weeks', 'days', 'hours', 'minutes'];
    if (includeSeconds) {
      keys.push('seconds');
    }
    const strings = keys.map((key) => `${this[key]}`);
    return strings.join(':');
  }

  /**
   * Returns a string representing the time period in hours and minutes.
   * @param includeSeconds Outputs also seconds if true.
   * @returns A string representing the time period in hours and minutes.
   */
  hoursAndMinutes(includeSeconds = false) {
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
}
