import util from './util';

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
  var d = new Date(Date.UTC(2013, 0, 15, 11, 22, 33));
  expect(util.toHourMinutes(d)).toBe('11:22');
});

test('toCompactTimestamp', () => {
  var d = new Date(Date.UTC(2013, 0, 15, 11, 22, 33, 444));
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
