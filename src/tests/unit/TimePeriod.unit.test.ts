import TimePeriod from '../../common/TimePeriod';

const secondMs = 1000;

const minuteS = 60;
const minuteMs = minuteS * secondMs;

const hourMin = 60;
const hourMs = hourMin * minuteMs;
const hourS = hourMin * minuteS;

const calendarDayH = 24;
const calendarDayMs = calendarDayH * hourMs;
const calendarDayS = calendarDayH * hourS;
const calendarDayMin = calendarDayH * hourMin;

const calendarYearD = 365.2425;
const calendarYearMs = calendarYearD * calendarDayMs;
const calendarYearS = calendarYearD * calendarDayS;
const calendarYearMin = calendarYearD * calendarDayMin;
const calendarYearH = calendarYearD * calendarDayH;

const calendarMonthD = calendarYearD / 12;
const calendarMonthMs = calendarMonthD * calendarDayMs;
const calendarMonthS = calendarMonthD * calendarDayS;
const calendarMonthMin = calendarMonthD * calendarDayMin;
const calendarMonthH = calendarMonthD * calendarDayH;

const calendarWeekD = 7;
const calendarWeekMs = calendarWeekD * calendarDayMs;
const calendarWeekS = calendarWeekD * calendarDayS;
const calendarWeekMin = calendarWeekD * calendarDayMin;
const calendarWeekH = calendarWeekD * calendarDayH;

const workDayH = 8;
const workDayMs = workDayH * hourMs;
const workDayS = workDayH * hourS;
const workDayMin = workDayH * hourMin;

const workYearD = 52 * 5;
const workYearMs = workYearD * workDayMs;
const workYearS = workYearD * workDayS;
const workYearMin = workYearD * workDayMin;
const workYearH = workYearD * workDayH;

const workMonthD = 20;
const workMonthMs = workMonthD * workDayMs;
const workMonthS = workMonthD * workDayS;
const workMonthMin = workMonthD * workDayMin;
const workMonthH = workMonthD * workDayH;

const workWeekD = 5;
const workWeekMs = workWeekD * workDayMs;
const workWeekS = workWeekD * workDayS;
const workWeekMin = workWeekD * workDayMin;
const workWeekH = workWeekD * workDayH;

describe('Calculates times correctly', () => {
  test('Hours, minutes, seconds and milliseconds: 1 h 30 min 20 s 10 ms', () => {
    const timePeriod = new TimePeriod(
      1 * hourMs + 30 * minuteMs + 20 * secondMs + 10
    );
    expect(timePeriod.hoursTotal).toEqual(1);
    expect(timePeriod.hours).toEqual(1);
    expect(timePeriod.minutesTotal).toEqual(90);
    expect(timePeriod.minutes).toEqual(30);
    expect(timePeriod.secondsTotal).toEqual(90 * 60 + 20);
    expect(timePeriod.seconds).toEqual(20);
    expect(timePeriod.millisecondsTotal).toEqual(90 * 60 * 1000 + 20010);
    expect(timePeriod.milliseconds).toEqual(10);
  });

  test('Variable units with calendar rates: 1 y 2 mo 3 wk 4 d 5 h 6 min 7 s 8 ms ', () => {
    const periodInMilliseconds =
      calendarYearMs +
      2 * calendarMonthMs +
      3 * calendarWeekMs +
      4 * calendarDayMs +
      5 * hourMs +
      6 * minuteMs +
      7 * secondMs +
      8;
    const timePeriod = new TimePeriod(
      periodInMilliseconds,
      TimePeriod.timeParamsCalendar
    );
    expect(timePeriod.hoursTotal).toEqual(
      Math.floor(
        calendarYearH +
          2 * calendarMonthH +
          3 * calendarWeekH +
          4 * calendarDayH +
          5
      )
    );
    expect(timePeriod.hours).toEqual(5);
    expect(timePeriod.minutesTotal).toEqual(
      Math.floor(
        calendarYearMin +
          2 * calendarMonthMin +
          3 * calendarWeekMin +
          4 * calendarDayMin +
          5 * hourMin +
          6
      )
    );
    expect(timePeriod.minutes).toEqual(6);
    expect(timePeriod.secondsTotal).toEqual(
      Math.floor(
        calendarYearS +
          2 * calendarMonthS +
          3 * calendarWeekS +
          4 * calendarDayS +
          5 * 60 * 60 +
          6 * 60 +
          7
      )
    );
    expect(timePeriod.seconds).toEqual(7);
    expect(timePeriod.millisecondsTotal).toEqual(periodInMilliseconds);
    expect(timePeriod.milliseconds).toEqual(8);
  });

  test('Variable units with work rates: 1 y 2 mo 3 wk 4 d 5 h 6 min 7 s 8 ms ', () => {
    const periodInMilliseconds =
      workYearMs +
      2 * workMonthMs +
      3 * workWeekMs +
      4 * workDayMs +
      5 * hourMs +
      6 * minuteMs +
      7 * secondMs +
      8;
    const timePeriod = new TimePeriod(
      periodInMilliseconds,
      TimePeriod.timeParamsWork
    );
    expect(timePeriod.hoursTotal).toEqual(
      Math.floor(workYearH + 2 * workMonthH + 3 * workWeekH + 4 * workDayH + 5)
    );
    expect(timePeriod.hours).toEqual(5);
    expect(timePeriod.minutesTotal).toEqual(
      Math.floor(
        workYearMin +
          2 * workMonthMin +
          3 * workWeekMin +
          4 * workDayMin +
          5 * hourMin +
          6
      )
    );
    expect(timePeriod.minutes).toEqual(6);
    expect(timePeriod.secondsTotal).toEqual(
      Math.floor(
        workYearS +
          2 * workMonthS +
          3 * workWeekS +
          4 * workDayS +
          5 * 60 * 60 +
          6 * 60 +
          7
      )
    );
    expect(timePeriod.seconds).toEqual(7);
    expect(timePeriod.millisecondsTotal).toEqual(periodInMilliseconds);
    expect(timePeriod.milliseconds).toEqual(8);
  });
});

describe('Outputs correct strings', () => {
  test('Long output is correct', () => {
    const periodInMilliseconds =
      calendarYearMs +
      2 * calendarMonthMs +
      3 * calendarWeekMs +
      4 * calendarDayMs +
      5 * hourMs +
      6 * minuteMs +
      7 * secondMs +
      8;
    const timePeriod = new TimePeriod(
      periodInMilliseconds,
      TimePeriod.timeParamsCalendar
    );
    const output = timePeriod.longStr();
    expect(output).toEqual(
      '1 year, 2 months, 3 weeks, 4 days, 5 hours and 6 minutes'
    );
  });

  test('Long output includes seconds if includeSeconds is true', () => {
    const periodInMilliseconds =
      calendarYearMs +
      2 * calendarMonthMs +
      3 * calendarWeekMs +
      4 * calendarDayMs +
      5 * hourMs +
      6 * minuteMs +
      7 * secondMs +
      8;
    const timePeriod = new TimePeriod(
      periodInMilliseconds,
      TimePeriod.timeParamsCalendar
    );
    const output = timePeriod.longStr(true);
    expect(output).toEqual(
      '1 year, 2 months, 3 weeks, 4 days, 5 hours, 6 minutes and 7 seconds'
    );
  });

  test('Short output is correct', () => {
    const periodInMilliseconds =
      calendarYearMs +
      2 * calendarMonthMs +
      3 * calendarWeekMs +
      4 * calendarDayMs +
      5 * hourMs +
      6 * minuteMs +
      7 * secondMs +
      8;
    const timePeriod = new TimePeriod(
      periodInMilliseconds,
      TimePeriod.timeParamsCalendar
    );
    const output = timePeriod.shortStr();
    expect(output).toEqual('1 y, 2 mo, 3 wk, 4 d, 5 h and 6 min');
  });

  test('Short includes seconds if includeSeconds is true', () => {
    const periodInMilliseconds =
      calendarYearMs +
      2 * calendarMonthMs +
      3 * calendarWeekMs +
      4 * calendarDayMs +
      5 * hourMs +
      6 * minuteMs +
      7 * secondMs +
      8;
    const timePeriod = new TimePeriod(
      periodInMilliseconds,
      TimePeriod.timeParamsCalendar
    );
    const output = timePeriod.shortStr(true);
    expect(output).toEqual('1 y, 2 mo, 3 wk, 4 d, 5 h, 6 min and 7 s');
  });

  test('Narrow output is correct', () => {
    const periodInMilliseconds =
      calendarYearMs +
      2 * calendarMonthMs +
      3 * calendarWeekMs +
      4 * calendarDayMs +
      5 * hourMs +
      6 * minuteMs +
      7 * secondMs +
      8;
    const timePeriod = new TimePeriod(
      periodInMilliseconds,
      TimePeriod.timeParamsCalendar
    );
    const output = timePeriod.narrowStr();
    expect(output).toEqual('1y 2mo 3wk 4d 5h 6min');
  });

  test('Narrow output includes seconds if includeSeconds is true', () => {
    const periodInMilliseconds =
      calendarYearMs +
      2 * calendarMonthMs +
      3 * calendarWeekMs +
      4 * calendarDayMs +
      5 * hourMs +
      6 * minuteMs +
      7 * secondMs +
      8;
    const timePeriod = new TimePeriod(
      periodInMilliseconds,
      TimePeriod.timeParamsCalendar
    );
    const output = timePeriod.narrowStr(true);
    expect(output).toEqual('1y 2mo 3wk 4d 5h 6min 7s');
  });

  test('Digital output is correct', () => {
    const periodInMilliseconds =
      calendarYearMs +
      2 * calendarMonthMs +
      3 * calendarWeekMs +
      4 * calendarDayMs +
      5 * hourMs +
      6 * minuteMs +
      7 * secondMs +
      8;
    const timePeriod = new TimePeriod(
      periodInMilliseconds,
      TimePeriod.timeParamsCalendar
    );
    const output = timePeriod.digitalStr();
    expect(output).toEqual('01:02:03:04:05:06');
  });

  test('Digital output includes seconds if includeSeconds is true', () => {
    const periodInMilliseconds =
      calendarYearMs +
      2 * calendarMonthMs +
      3 * calendarWeekMs +
      4 * calendarDayMs +
      5 * hourMs +
      6 * minuteMs +
      7 * secondMs +
      8;
    const timePeriod = new TimePeriod(
      periodInMilliseconds,
      TimePeriod.timeParamsCalendar
    );
    const output = timePeriod.digitalStr(true);
    expect(output).toEqual('01:02:03:04:05:06:07');
  });

  test('Output from hoursAndMinutes() is correct', () => {
    const periodInMilliseconds =
      calendarYearMs +
      2 * calendarMonthMs +
      3 * calendarWeekMs +
      4 * calendarDayMs +
      5 * hourMs +
      6 * minuteMs +
      7 * secondMs +
      8;
    const timePeriod = new TimePeriod(
      periodInMilliseconds,
      TimePeriod.timeParamsCalendar
    );
    const output = timePeriod.hoursAndMinutesStr();
    expect(output).toEqual(`${timePeriod.hoursTotal}h 6min`);
  });

  test('Output from hoursAndMinutes() includes seconds if includeSeconds is true', () => {
    const periodInMilliseconds =
      calendarYearMs +
      2 * calendarMonthMs +
      3 * calendarWeekMs +
      4 * calendarDayMs +
      5 * hourMs +
      6 * minuteMs +
      7 * secondMs +
      8;
    const timePeriod = new TimePeriod(
      periodInMilliseconds,
      TimePeriod.timeParamsCalendar
    );
    const output = timePeriod.hoursAndMinutesStr(true);
    expect(output).toEqual(`${timePeriod.hoursTotal}h 6min 7s`);
  });

  test('Output from daysHoursAndMinutes() is correct', () => {
    const periodInMilliseconds =
      calendarYearMs +
      2 * calendarMonthMs +
      3 * calendarWeekMs +
      4 * calendarDayMs +
      5 * hourMs +
      6 * minuteMs +
      7 * secondMs +
      8;
    const timePeriod = new TimePeriod(
      periodInMilliseconds,
      TimePeriod.timeParamsCalendar
    );
    const output = timePeriod.daysHoursAndMinutesStr();
    expect(output).toEqual(`${timePeriod.daysTotal}d 5h 6min`);
  });

  test('Output from daysHoursAndMinutes() includes seconds if includeSeconds is true', () => {
    const periodInMilliseconds =
      calendarYearMs +
      2 * calendarMonthMs +
      3 * calendarWeekMs +
      4 * calendarDayMs +
      5 * hourMs +
      6 * minuteMs +
      7 * secondMs +
      8;
    const timePeriod = new TimePeriod(
      periodInMilliseconds,
      TimePeriod.timeParamsCalendar
    );
    const output = timePeriod.daysHoursAndMinutesStr(true);
    expect(output).toEqual(`${timePeriod.daysTotal}d 5h 6min 7s`);
  });

  test('Output from conversionRatesStr() is correct', () => {
    const timePeriod = new TimePeriod(0, {
      day: 8,
      week: 5,
      month: 20,
      year: 52 * 5,
    });
    const result = timePeriod.conversionRatesStr();
    expect(result).toEqual('d=8h, wk=5d, mo=20d, y=52wk');
  });

  test('Output from conversionRateDayStr() is correct', () => {
    const timePeriod = new TimePeriod(0, {
      day: 8,
      week: 5,
      month: 20,
      year: 52 * 5,
    });
    const result = timePeriod.conversionRateDayStr();
    expect(result).toEqual('d=8h');
  });
});
