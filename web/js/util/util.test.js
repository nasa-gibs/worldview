import util from './util';

test('pad', () => {
  expect(util.pad('0.000', 6, '0')).toBe('00.000');
});

test('repeat', () => {
  expect(util.repeat('.', 5)).toBe('.....');
});

describe('fromQueryString', () => {
  const tests = [
    { qs: '', obj: {}, name: 'zero' },
    { qs: '?foo=a&bar=b', obj: { foo: 'a', bar: 'b' }, name: 'two' },
    { qs: 'foo=a&bar=b', obj: { foo: 'a', bar: 'b' }, name: 'no leading ?' },
    { qs: '?foo=image%2fjpeg', obj: { foo: 'image/jpeg' }, name: 'decodes' },
  ];

  tests.forEach((t) => {
    test(t.name, () => {
      expect(util.fromQueryString(t.qs)).toEqual(t.obj);
    });
  });
});

describe('toQueryString', () => {
  const tests = [
    { qs: '', obj: {}, name: 'zero' },
    { qs: '?foo=a&bar=b', obj: { foo: 'a', bar: 'b' }, name: 'two' },
    { qs: '?foo=image%2Fjpeg', obj: { foo: 'image/jpeg' }, name: 'encodes' },
    {
      qs: '?path=/a/b', obj: { path: '/a/b' }, exceptions: ['%2f'], name: 'exceptions',
    },
  ];

  tests.forEach((t) => {
    test(t.name, () => {
      expect(util.toQueryString(t.obj, t.exceptions)).toEqual(t.qs);
    });
  });
});

describe('parseDateUTC', () => {
  const tests = [{
    str: '2013-03-15T11:22:33Z',
    date: new Date(Date.UTC(2013, 2, 15, 11, 22, 33)),
    name: 'timestamp',
  }, {
    str: '2013-03-15T11:22:33Z',
    date: new Date(Date.UTC(2013, 2, 15, 11, 22, 33)),
    name: 'timestamp without Z',
  }, {
    str: '2013-03-15',
    date: new Date(Date.UTC(2013, 2, 15)),
    name: 'time',
  }, {
    str: 'x',
    name: 'invalid',
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

test('toISOStringDate with date', () => {
  const d = new Date(Date.UTC(2013, 0, 15));
  expect(util.toISOStringDate(d)).toBe('2013-01-15');
});

test('toISOStringDate with string', () => {
  const d = '2013-01-15T11:22:33Z';
  expect(util.toISOStringDate(d)).toBe('2013-01-15');
});

test('toISOStringSeconds', () => {
  const d = new Date(Date.UTC(2013, 0, 15, 11, 22, 33));
  expect(util.toISOStringSeconds(d)).toBe('2013-01-15T11:22:33Z');
});

test('clearTimeUTC', () => {
  const d = new Date(2013, 2, 15, 12, 34, 56, 789);
  const dCleared = util.clearTimeUTC(d);
  expect(2013).toBe(dCleared.getUTCFullYear());
  expect(2).toBe(dCleared.getUTCMonth());
  expect(15).toBe(dCleared.getUTCDate());
  expect(0).toBe(dCleared.getUTCHours());
  expect(0).toBe(dCleared.getUTCMinutes());
  expect(0).toBe(dCleared.getUTCSeconds());
});

describe('dateAdd', () => {
  const tests = [
    { part: 'day', fn: 'getUTCDate', answer: 5 },
    { part: 'month', fn: 'getUTCMonth', answer: 5 },
    { part: 'year', fn: 'getUTCFullYear', answer: 2015 },
    { part: 'foo' },
  ];

  tests.forEach((t) => {
    test(t.part, () => {
      const d = new Date(Date.UTC(2011, 1, 1));
      if (t.answer) {
        const result = util.dateAdd(d, t.part, 4);
        expect(result[t.fn]()).toBe(t.answer);
      } else {
        expect(() => util.dateAdd(d, t.part, 1)).toThrow();
      }
    });
  });
});


describe('daysInYear', () => {
  const tests = [
    { date: Date.UTC(2015, 5, 26), doy: '177', name: '2015 jun 26 => 177' },
    { date: Date.UTC(2015, 0, 1), doy: '001', name: 'first of year' },
    { date: Date.UTC(2015, 11, 31), doy: '365', name: 'last day of year' },
    { date: Date.UTC(2016, 11, 31), doy: '366', name: 'last day of leap year' },
  ];
  tests.forEach((t) => {
    test(t.name, () => {
      const d = new Date(t.date);
      expect(util.daysInYear(d)).toBe(t.doy);
    });
  });
});

describe('clamp', () => {
  const tests = [
    {
      v: 15, min: 10, max: 20, answer: 15, name: 'middle',
    },
    {
      v: 8, min: 10, max: 20, answer: 10, name: 'min',
    },
    {
      v: 22, min: 10, max: 20, answer: 20, name: 'max',
    },
  ];

  tests.forEach((t) => {
    test(t.name, () => {
      expect(util.clamp(t.v, t.min, t.max)).toBe(t.answer);
    });
  });
});

describe('formatDMS', () => {
  const tests = [{
    name: 'zero',
    dd: [0, 0],
    str: [' 0°00\'00"N', '  0°00\'00"E'],
  }, {
    name: 'positive',
    dd: [12.582222, 12.582222],
    str: ['12°34\'55"N', ' 12°34\'55"E'],
  }, {
    name: 'negative',
    dd: [-12.582222, -12.582222],
    str: ['12°34\'55"S', ' 12°34\'55"W'],
  }, {
    name: 'max',
    dd: [89.999997, 179.999997],
    str: ['89°59\'59"N', '179°59\'59"E'],
  }];

  tests.forEach((t) => {
    test(t.name, () => {
      const lat = util.formatDMS(t.dd[0], 'latitude');
      const lon = util.formatDMS(t.dd[1], 'longitude');
      expect(lat).toBe(t.str[0]);
      expect(lon).toBe(t.str[1]);
    });
  });
});

describe('formatDM', () => {
  const tests = [{
    name: 'zero',
    dd: [0, 0],
    str: [' 0°00.000\'N', '  0°00.000\'E'],
  }, {
    name: 'positive',
    dd: [12.582222, 12.582222],
    str: ['12°34.933\'N', ' 12°34.933\'E'],
  }, {
    name: 'negative',
    dd: [-12.582222, -12.582222],
    str: ['12°34.933\'S', ' 12°34.933\'W'],
  }, {
    name: 'max',
    dd: [89.999997, 179.999997],
    str: ['89°59.999\'N', '179°59.999\'E'],
  }];

  tests.forEach((t) => {
    test(t.name, () => {
      const lat = util.formatDM(t.dd[0], 'latitude');
      const lon = util.formatDM(t.dd[1], 'longitude');
      expect(lat).toBe(t.str[0]);
      expect(lon).toBe(t.str[1]);
    });
  });
});

test('Convert wrapped longitude to value between -180 & 180', () => {
  expect(util.normalizeWrappedLongitude(-181)).toBe(179);
  expect(util.normalizeWrappedLongitude(181)).toBe(-179);
  expect(util.normalizeWrappedLongitude(-721)).toBe(-1);
  expect(util.normalizeWrappedLongitude(721)).toBe(1);
  expect(util.normalizeWrappedLongitude(541)).toBe(-179);
  expect(util.normalizeWrappedLongitude(-541)).toBe(179);
});
describe('encodeId/decodeId', () => {
  const tests = [
    { decoded: '', encoded: '' },
    { decoded: 'foo', encoded: 'foo' },
    { decoded: 'really.', encoded: 'really__2E__' },
    { decoded: 'foo:bar', encoded: 'foo__3A__bar' },
    { decoded: 'foos.bars:', encoded: 'foos__2E__bars__3A__' },
  ];

  tests.forEach((t) => {
    test(`encode "${t.decoded}"`, () => {
      expect(util.encodeId(t.decoded)).toBe(t.encoded);
    });
    test(`decode "${t.encoded}"`, () => {
      expect(util.decodeId(t.encoded)).toBe(t.decoded);
    });
  });
});
