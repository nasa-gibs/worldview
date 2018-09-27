import util from './util';

test('pad', () => {
  expect(util.pad('0.000', 6, '0')).toBe('00.000');
});

test('repeat', () => {
  expect(util.repeat('.', 5)).toBe('.....');
});

describe('fromQueryString', () => {
  let tests = [
    { qs: '', obj: {}, name: 'zero' },
    { qs: '?foo=a&bar=b', obj: { foo: 'a', bar: 'b' }, name: 'two' },
    { qs: 'foo=a&bar=b', obj: { foo: 'a', bar: 'b' }, name: 'no leading ?' },
    { qs: '?foo=image%2fjpeg', obj: { foo: 'image/jpeg' }, name: 'decodes' }
  ];

  tests.forEach((t) => {
    test(t.name, () => {
      expect(util.fromQueryString(t.qs)).toEqual(t.obj);
    });
  });
});

describe('toQueryString', () => {
  let tests = [
    { qs: '', obj: {}, name: 'zero' },
    { qs: '?foo=a&bar=b', obj: { foo: 'a', bar: 'b' }, name: 'two' },
    { qs: '?foo=image%2Fjpeg', obj: { foo: 'image/jpeg' }, name: 'encodes' },
    { qs: '?path=/a/b', obj: { path: '/a/b' }, exceptions: ['%2f'], name: 'exceptions' }
  ];

  tests.forEach((t) => {
    test(t.name, () => {
      expect(util.toQueryString(t.obj, t.exceptions)).toEqual(t.qs);
    });
  });
});

describe('parseDateUTC', () => {
  let tests = [{
    str: '2013-03-15T11:22:33Z',
    date: new Date(Date.UTC(2013, 2, 15, 11, 22, 33)),
    name: 'timestamp'
  }, {
    str: '2013-03-15T11:22:33Z',
    date: new Date(Date.UTC(2013, 2, 15, 11, 22, 33)),
    name: 'timestamp without Z'
  }, {
    str: '2013-03-15',
    date: new Date(Date.UTC(2013, 2, 15)),
    name: 'time'
  }, {
    str: 'x',
    name: 'invalid'
  }];

  tests.forEach((t) => {
    test(t.name, () => {
      if (t.date) {
        expect(util.parseDateUTC(t.str)).toEqual(t.date);
      } else {
        expect(() => util.parseDateUTC(t.str)).toThrow();
      }
    });
  });
});

test('toJulianDate', () => {
  let d = new Date(Date.UTC(2013, 0, 15));
  expect(util.toJulianDate(d)).toBe('2013015');
});

test('toISOStringDate', () => {
  let d = new Date(Date.UTC(2013, 0, 15));
  expect(util.toISOStringDate(d)).toBe('2013-01-15');
});

test('toISOStringSeconds', () => {
  let d = new Date(Date.UTC(2013, 0, 15, 11, 22, 33));
  expect(util.toISOStringSeconds(d)).toBe('2013-01-15T11:22:33Z');
});

test('toHourMinutes', () => {
  let d = new Date(Date.UTC(2013, 0, 15, 11, 22, 33));
  expect(util.toHourMinutes(d)).toBe('11:22');
});

test('toCompactTimestamp', () => {
  let d = new Date(Date.UTC(2013, 0, 15, 11, 22, 33, 444));
  expect(util.toCompactTimestamp(d)).toBe('20130115112233444');
});

describe('fromCompactTimestamp', () => {
  test('parses timestamp', () => {
    let answer = new Date(Date.UTC(2013, 0, 15, 11, 22, 33, 444));
    let result = util.fromCompactTimestamp('20130115112233444');
    expect(answer.getTime()).toEqual(result.getTime());
  });

  test('invalid', () => {
    expect(() => util.fromCompactTimestamp('x0130115112233444')).toThrow();
  });
});

test('clearTimeUTC', () => {
  var d = new Date(2013, 2, 15, 12, 34, 56, 789);
  util.clearTimeUTC(d);
  expect(2013).toBe(d.getUTCFullYear());
  expect(2).toBe(d.getUTCMonth());
  expect(15).toBe(d.getUTCDate());
  expect(0).toBe(d.getUTCHours());
  expect(0).toBe(d.getUTCMinutes());
  expect(0).toBe(d.getUTCSeconds());
});

describe('dateAdd', () => {
  let tests = [
    { part: 'day', fn: 'getDate', answer: 5 },
    { part: 'month', fn: 'getMonth', answer: 5 },
    { part: 'year', fn: 'getFullYear', answer: 2015 },
    { part: 'foo' }
  ];

  tests.forEach((t) => {
    test(t.part, () => {
      let d = new Date(2011, 1, 1);
      if (t.answer) {
        let result = util.dateAdd(d, t.part, 4);
        expect(result[t.fn]()).toBe(t.answer);
      } else {
        expect(() => util.dateAdd(d, t.part, 1)).toThrow();
      }
    });
  });
});

describe('daysInMonth', () => {
  test('feb, non-leap', () => {
    var d = new Date(2015, 1, 15);
    expect(util.daysInMonth(d)).toBe(28);
  });

  test('feb, leap', () => {
    var d = new Date(2016, 1, 15);
    expect(util.daysInMonth(d)).toBe(29);
  });
});

describe('clamp', () => {
  let tests = [
    { v: 15, min: 10, max: 20, answer: 15, name: 'middle' },
    { v: 8, min: 10, max: 20, answer: 10, name: 'min' },
    { v: 22, min: 10, max: 20, answer: 20, name: 'max' }
  ];

  tests.forEach((t) => {
    test(t.name, () => {
      expect(util.clamp(t.v, t.min, t.max)).toBe(t.answer);
    });
  });
});

describe('roll', () => {
  let tests = [
    { v: 15, min: 10, max: 20, answer: 15, name: 'middle' },
    { v: 8, min: 10, max: 20, answer: 19, name: 'min' },
    { v: 22, min: 10, max: 20, answer: 11, name: 'max' }
  ];

  tests.forEach((t) => {
    test(t.name, () => {
      expect(util.roll(t.v, t.min, t.max)).toBe(t.answer);
    });
  });
});

describe('rollDate', () => {
  let tests = [{
    name: 'day up',
    d: new Date(Date.UTC(2014, 1, 15)),
    period: { value: 1, unit: 'day' },
    answer: new Date(Date.UTC(2014, 1, 16))
  }, {
    name: 'day up, roll',
    d: new Date(Date.UTC(2014, 1, 28)),
    period: { value: 1, unit: 'day' },
    answer: new Date(Date.UTC(2014, 1, 1))
  }, {
    name: 'day down',
    d: new Date(Date.UTC(2014, 1, 15)),
    period: { value: -1, unit: 'day' },
    answer: new Date(Date.UTC(2014, 1, 14))
  }, {
    name: 'day down, roll',
    d: new Date(Date.UTC(2014, 1, 1)),
    period: { value: -1, unit: 'day' },
    answer: new Date(Date.UTC(2014, 1, 28))
  }, {
    name: 'day up, roll over max',
    maxDate: new Date(Date.UTC(2014, 11, 2)),
    d: new Date(Date.UTC(2014, 11, 2)),
    period: { value: 1, unit: 'day' },
    answer: new Date(Date.UTC(2014, 11, 1))
  }, {
    name: 'day down, roll over max',
    maxDate: new Date(Date.UTC(2014, 11, 2)),
    d: new Date(Date.UTC(2014, 11, 1)),
    period: { value: -1, unit: 'day' },
    answer: new Date(Date.UTC(2014, 11, 2))
  }, {
    name: 'day up, roll over min',
    minDate: new Date(Date.UTC(2014, 11, 2)),
    d: new Date(Date.UTC(2014, 11, 31)),
    period: { value: 1, unit: 'day' },
    answer: new Date(Date.UTC(2014, 11, 2))
  }, {
    name: 'day down, roll over min',
    minDate: new Date(Date.UTC(2014, 11, 2)),
    d: new Date(Date.UTC(2014, 11, 2)),
    period: { value: -1, unit: 'day' },
    answer: new Date(Date.UTC(2014, 11, 31))
  }, {
    name: 'month up',
    d: new Date(Date.UTC(2014, 5, 15)),
    period: { value: 1, unit: 'month' },
    answer: new Date(Date.UTC(2014, 6, 15))
  }, {
    name: 'month up, roll',
    d: new Date(Date.UTC(2014, 11, 15)),
    period: { value: 1, unit: 'month' },
    answer: new Date(Date.UTC(2014, 0, 15))
  }, {
    name: 'month down',
    d: new Date(Date.UTC(2014, 5, 15)),
    period: { value: -1, unit: 'month' },
    answer: new Date(Date.UTC(2014, 4, 15))
  }, {
    name: 'month down, roll',
    d: new Date(Date.UTC(2014, 0, 15)),
    period: { value: -1, unit: 'month' },
    answer: new Date(Date.UTC(2014, 11, 15))
  }, {
    name: 'month up, roll over max',
    maxDate: new Date(Date.UTC(2014, 10, 2)),
    d: new Date(Date.UTC(2014, 9, 20)),
    period: { value: 1, unit: 'month' },
    answer: new Date(Date.UTC(2014, 10, 2))
  }, {
    name: 'month up, roll past max',
    maxDate: new Date(Date.UTC(2014, 10, 2)),
    d: new Date(Date.UTC(2014, 10, 1)),
    period: { value: 1, unit: 'month' },
    answer: new Date(Date.UTC(2014, 0, 1))
  }, {
    name: 'month down, roll over max',
    maxDate: new Date(Date.UTC(2014, 10, 2)),
    d: new Date(Date.UTC(2014, 0, 20)),
    period: { value: -1, unit: 'month' },
    answer: new Date(Date.UTC(2014, 10, 2))
  }, {
    name: 'month up, truncate day',
    d: new Date(Date.UTC(2014, 0, 31)),
    period: { value: 1, unit: 'month' },
    answer: new Date(Date.UTC(2014, 1, 28))
  }, {
    name: 'month down, roll over min',
    minDate: new Date(Date.UTC(2014, 2, 25)),
    d: new Date(Date.UTC(2014, 3, 1)),
    period: { value: -1, unit: 'month' },
    answer: new Date(Date.UTC(2014, 2, 25))
  }, {
    name: 'month up, roll over min',
    minDate: new Date(Date.UTC(2014, 2, 25)),
    d: new Date(Date.UTC(2014, 11, 1)),
    period: { value: 1, unit: 'month' },
    answer: new Date(Date.UTC(2014, 2, 25))
  }, {
    name: 'month down, roll past min',
    minDate: new Date(Date.UTC(2014, 2, 25)),
    d: new Date(Date.UTC(2014, 2, 27)),
    period: { value: -1, unit: 'month' },
    answer: new Date(Date.UTC(2014, 11, 27))
  }, {
    name: 'year up',
    d: new Date(Date.UTC(2014, 5, 15)),
    period: { value: 1, unit: 'year' },
    answer: new Date(Date.UTC(2015, 5, 15))
  }, {
    name: 'year down',
    d: new Date(Date.UTC(2014, 5, 15)),
    period: { value: -1, unit: 'year' },
    answer: new Date(Date.UTC(2013, 5, 15))
  }, {
    name: 'year up, roll over max',
    minDate: new Date(Date.UTC(2000, 3, 12)),
    maxDate: new Date(Date.UTC(2015, 6, 16)),
    d: new Date(Date.UTC(2015, 0, 1)),
    period: { value: 1, unit: 'year' },
    answer: new Date(Date.UTC(2000, 3, 12))
  }, {
    name: 'year down, roll over min',
    minDate: new Date(Date.UTC(2000, 3, 12)),
    maxDate: new Date(Date.UTC(2015, 6, 16)),
    d: new Date(Date.UTC(2000, 8, 1)),
    period: { value: -1, unit: 'year' },
    answer: new Date(Date.UTC(2015, 6, 16))
  }];

  tests.forEach((t) => {
    test(t.name, () => {
      let result = util.rollDate(t.d, t.period.unit, t.period.value, t.minDate, t.maxDate);
      expect(result).toEqual(t.answer);
    });
  });
});

describe('formatDMS', () => {
  let tests = [{
    name: 'zero',
    dd: [0, 0],
    str: [' 0&deg;00\'00"N', '  0&deg;00\'00"E']
  }, {
    name: 'positive',
    dd: [12.582222, 12.582222],
    str: ['12&deg;34\'55"N', ' 12&deg;34\'55"E']
  }, {
    name: 'negative',
    dd: [-12.582222, -12.582222],
    str: ['12&deg;34\'55"S', ' 12&deg;34\'55"W']
  }, {
    name: 'max',
    dd: [89.999997, 179.999997],
    str: ['89&deg;59\'59"N', '179&deg;59\'59"E']
  }];

  tests.forEach((t) => {
    test(t.name, () => {
      let lat = util.formatDMS(t.dd[0], 'latitude');
      let lon = util.formatDMS(t.dd[1], 'longitude');
      expect(lat).toBe(t.str[0]);
      expect(lon).toBe(t.str[1]);
    });
  });
});

describe('formatDM', () => {
  let tests = [{
    name: 'zero',
    dd: [0, 0],
    str: [' 0&deg;00.000\'N', '  0&deg;00.000\'E']
  }, {
    name: 'positive',
    dd: [12.582222, 12.582222],
    str: ['12&deg;34.933\'N', ' 12&deg;34.933\'E']
  }, {
    name: 'negative',
    dd: [-12.582222, -12.582222],
    str: ['12&deg;34.933\'S', ' 12&deg;34.933\'W']
  }, {
    name: 'max',
    dd: [89.999997, 179.999997],
    str: ['89&deg;59.999\'N', '179&deg;59.999\'E']
  }];

  tests.forEach((t) => {
    test(t.name, () => {
      let lat = util.formatDM(t.dd[0], 'latitude');
      let lon = util.formatDM(t.dd[1], 'longitude');
      expect(lat).toBe(t.str[0]);
      expect(lon).toBe(t.str[1]);
    });
  });
});

describe('encodeId/decodeId', () => {
  let tests = [
    { decoded: '', encoded: '' },
    { decoded: 'foo', encoded: 'foo' },
    { decoded: 'really.', encoded: 'really__2E__' },
    { decoded: 'foo:bar', encoded: 'foo__3A__bar' },
    { decoded: 'foos.bars:', encoded: 'foos__2E__bars__3A__' }
  ];

  tests.forEach((t) => {
    test('encode "' + t.decoded + '"', () => {
      expect(util.encodeId(t.decoded)).toBe(t.encoded);
    });
    test('decode "' + t.encoded + '"', () => {
      expect(util.decodeId(t.encoded)).toBe(t.decoded);
    });
  });
});
