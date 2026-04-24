import util from './util';

// Mock dependencies
jest.mock('./browser', () => ({ isMobile: false }));
jest.mock('./events', () => ({ on: jest.fn(), off: jest.fn() }));
jest.mock('./load', () => jest.fn());
jest.mock('./local-storage', () => ({
  keys: { COORDINATE_FORMAT: 'COORDINATE_FORMAT' },
  getItem: jest.fn(),
  setItem: jest.fn(),
}));

import safeLocalStorage from './local-storage';

describe('util', () => {
  describe('repeat', () => {
    it('repeats value n times', () => expect(util.repeat('x', 3)).toBe('xxx'));
    it('returns empty string for length 0', () => expect(util.repeat('x', 0)).toBe(''));
  });

  describe('pad', () => {
    it('pads string to given width', () => expect(util.pad('5', 3, '0')).toBe('005'));
    it('does not pad if already at width', () => expect(util.pad('123', 3, '0')).toBe('123'));
    it('converts number to string', () => expect(util.pad(7, 2, '0')).toBe('07'));
  });

  describe('fromQueryString', () => {
    it('parses query string', () => expect(util.fromQueryString('?foo=a&bar=b')).toEqual({ foo: 'a', bar: 'b' }));
    it('returns empty object for empty string', () => expect(util.fromQueryString('')).toEqual({}));
    it('decodes URI components', () => expect(util.fromQueryString('?path=%2Ffoo')).toEqual({ path: '/foo' }));
    it('handles string without leading ?', () => expect(util.fromQueryString('foo=a')).toEqual({ foo: 'a' }));
  });

  describe('toQueryString', () => {
    it('converts object to query string', () => expect(util.toQueryString({ foo: 'a', bar: 'b' })).toBe('?foo=a&bar=b'));
    it('returns empty string for empty object', () => expect(util.toQueryString({})).toBe(''));
    it('skips falsy values', () => expect(util.toQueryString({ foo: 'a', bar: null })).toBe('?foo=a'));
    it('applies exceptions', () => expect(util.toQueryString({ format: 'image/png' }, ['%2F'])).toBe('?format=image/png'));
  });

  describe('parseDateUTC', () => {
    it('parses YYYY-MM-DD', () => {
      const d = util.parseDateUTC('2020-01-15');
      expect(d.getUTCFullYear()).toBe(2020);
      expect(d.getUTCMonth()).toBe(0);
      expect(d.getUTCDate()).toBe(15);
    });
    it('parses YYYY-MM-DDTHH:MM:SS', () => {
      const d = util.parseDateUTC('2020-06-01T12:30:45');
      expect(d.getUTCHours()).toBe(12);
      expect(d.getUTCMinutes()).toBe(30);
      expect(d.getUTCSeconds()).toBe(45);
    });
    it('throws on invalid date', () => {
      expect(() => util.parseDateUTC('not-a-date')).toThrow();
    });
  });

  describe('parseTimestampUTC', () => {
    it('delegates to parseDateUTC', () => {
      const d = util.parseTimestampUTC('2021-03-10T00:00:00Z');
      expect(d.getUTCFullYear()).toBe(2021);
    });
  });

  describe('appendAttributesForURL', () => {
    it('returns id with no attributes', () => expect(util.appendAttributesForURL({ id: 'layer1', attributes: [] })).toBe('layer1'));
    it('appends attributes', () => expect(util.appendAttributesForURL({ id: 'layer1', attributes: [{ id: 'style', value: 'red' }] })).toBe('layer1(style=red)'));
    it('appends attribute without value', () => expect(util.appendAttributesForURL({ id: 'layer1', attributes: [{ id: 'flag' }] })).toBe('layer1(flag)'));
    it('returns empty string for non-object', () => expect(util.appendAttributesForURL('not-an-object')).toBe(''));
  });

  describe('toISOStringDate', () => {
    it('returns YYYY-MM-DD from date', () => expect(util.toISOStringDate(new Date('2020-05-10T00:00:00Z'))).toBe('2020-05-10'));
    it('returns YYYY-MM-DD from string', () => expect(util.toISOStringDate('2020-05-10T00:00:00Z')).toBe('2020-05-10'));
  });

  describe('toISOStringSeconds', () => {
    it('returns ISO string without milliseconds', () => expect(util.toISOStringSeconds(new Date('2020-05-10T12:30:45.123Z'))).toBe('2020-05-10T12:30:45Z'));
    it('clears time when shouldRemoveTime is true', () => expect(util.toISOStringSeconds(new Date('2020-05-10T12:30:45Z'), true)).toBe('2020-05-10T00:00:00Z'));
  });

  describe('clearTimeUTC', () => {
    it('sets UTC time to midnight', () => {
      const d = util.clearTimeUTC(new Date('2020-05-10T15:30:00Z'));
      expect(d.getUTCHours()).toBe(0);
      expect(d.getUTCMinutes()).toBe(0);
      expect(d.getUTCSeconds()).toBe(0);
    });
  });

  describe('dateAdd', () => {
    const base = new Date('2020-01-15T12:00:00Z');
    it('adds minutes', () => expect(util.dateAdd(base, 'minute', 30).getUTCMinutes()).toBe(30));
    it('adds hours', () => expect(util.dateAdd(base, 'hour', 3).getUTCHours()).toBe(15));
    it('adds days', () => expect(util.dateAdd(base, 'day', 5).getUTCDate()).toBe(20));
    it('adds months', () => expect(util.dateAdd(base, 'month', 2).getUTCMonth()).toBe(2));
    it('adds years', () => expect(util.dateAdd(base, 'year', 1).getUTCFullYear()).toBe(2021));
    it('throws on invalid interval', () => expect(() => util.dateAdd(base, 'week', 1)).toThrow());
  });

  describe('clamp', () => {
    it('returns value when in range', () => expect(util.clamp(5, 1, 10)).toBe(5));
    it('returns min when below', () => expect(util.clamp(-1, 0, 10)).toBe(0));
    it('returns max when above', () => expect(util.clamp(15, 0, 10)).toBe(10));
  });

  describe('cleanId', () => {
    it('replaces non-word chars with underscores', () => expect(util.cleanId('foo bar.baz')).toBe('foo_bar_baz'));
  });

  describe('encodeId / decodeId', () => {
    it('encodes special characters', () => expect(util.encodeId('foo.bar:baz,qux')).toBe('foo__2E__bar__3A__baz__2C__qux'));
    it('decodes back to original', () => expect(util.decodeId(util.encodeId('foo.bar:baz'))).toBe('foo.bar:baz'));
  });

  describe('hexToRGB', () => {
    it('converts hex to rgb string', () => expect(util.hexToRGB('ff0080')).toBe('rgb(255,0,128)'));
  });

  describe('hexToRGBA', () => {
    it('converts hex to rgba string', () => expect(util.hexToRGBA('ff008080')).toBe('rgba(255,0,128,128)'));
  });

  describe('rgbaToHex', () => {
    it('converts rgb to hex string', () => expect(util.rgbaToHex(255, 0, 128)).toBe('ff0080ff'));
  });

  describe('hexColorDelta', () => {
    it('returns 0 for identical colors', () => expect(util.hexColorDelta('ff0000', 'ff0000')).toBe(0));
    it('returns non-zero for different colors', () => expect(util.hexColorDelta('ff0000', '0000ff')).toBeGreaterThan(0));
  });

  describe('objectLength', () => {
    it('returns number of keys', () => expect(util.objectLength({ a: 1, b: 2 })).toBe(2));
    it('returns 0 for empty object', () => expect(util.objectLength({})).toBe(0));
  });

  describe('giveWeekDay', () => {
    it('returns correct day name', () => expect(util.giveWeekDay(new Date('2020-01-06T00:00:00Z'))).toBe('Monday'));
  });

  describe('giveMonth', () => {
    it('returns correct month name', () => expect(util.giveMonth(new Date('2020-06-01T00:00:00Z'))).toBe('June'));
  });

  describe('daysInYear', () => {
    it('returns Julian day as 3-char string', () => expect(util.daysInYear(new Date('2020-01-01T00:00:00Z'))).toBe('001'));
    it('returns correct day for non-first day', () => expect(util.daysInYear(new Date('2020-02-01T00:00:00Z'))).toBe('032'));
  });

  describe('format', () => {
    it('replaces placeholders', () => expect(util.format('Hello {1} and {2}', 'World', 'Moon')).toBe('Hello World and Moon'));
  });

  describe('toArray', () => {
    it('wraps non-array in array', () => expect(util.toArray('foo')).toEqual(['foo']));
    it('returns array as-is', () => expect(util.toArray([1, 2])).toEqual([1, 2]));
    it('returns empty array for falsy', () => expect(util.toArray(null)).toEqual([]));
  });

  describe('stringInArray', () => {
    it('returns index when found', () => expect(util.stringInArray(['a', 'b', 'c'], 'b')).toBe(1));
    it('returns false when not found', () => expect(util.stringInArray(['a', 'b'], 'z')).toBe(false));
  });

  describe('closestToIndex', () => {
    it('returns index of closest date', () => {
      const dates = [new Date('2020-01-01'), new Date('2020-06-01'), new Date('2020-12-01')];
      expect(util.closestToIndex(dates, new Date('2020-05-15').getTime())).toBe(1);
    });
  });

  describe('yearDiff', () => {
    it('returns year difference', () => expect(util.yearDiff(new Date('2015-01-01'), new Date('2020-01-01'))).toBe(5));
  });

  describe('monthDiff', () => {
    it('returns month difference', () => expect(util.monthDiff(new Date('2020-02-01'), new Date('2020-08-01'))).toBe(6));
  });

  describe('dayDiff', () => {
    it('returns day difference', () => expect(util.dayDiff(new Date('2020-01-01'), new Date('2020-01-11'))).toBe(10));
  });

  describe('minuteDiff', () => {
    it('returns minute difference', () => expect(util.minuteDiff(new Date('2020-01-01T00:00:00Z'), new Date('2020-01-01T01:00:00Z'))).toBe(60));
  });

  describe('normalizeWrappedLongitude', () => {
    it('returns unchanged value within -180 to 180', () => expect(util.normalizeWrappedLongitude(90)).toBe(90));
    it('normalizes value above 180', () => expect(util.normalizeWrappedLongitude(270)).toBe(-90));
    it('normalizes value below -180', () => expect(util.normalizeWrappedLongitude(-270)).toBe(90));
  });

  describe('getUTCNumbers', () => {
    it('returns prefixed UTC date parts', () => {
      const result = util.getUTCNumbers(new Date('2020-06-15T10:30:00Z'), 'min');
      expect(result).toMatchObject({
        minYear: 2020,
        minMonth: 5,
        minDay: 15,
        minHour: 10,
        minMinute: 30,
      });
    });
  });

  describe('getTimezoneOffsetDate', () => {
    it('returns offset date', () => {
      const d = new Date('2020-01-01T00:00:00Z');
      const result = util.getTimezoneOffsetDate(d);
      expect(result.getTime()).toBe(d.getTime() - d.getTimezoneOffset() * 60000);
    });
  });

  describe('roundTimeOneMinute', () => {
    it('rounds seconds up to next minute', () => {
      const d = new Date('2020-01-01T00:00:45.000Z');
      const result = util.roundTimeOneMinute(d);
      expect(result.getUTCSeconds()).toBe(0);
    });
  });

  describe('roundTimeQuarterHour', () => {
    it('rounds minutes to nearest quarter', () => {
      const d = new Date('2020-01-01T00:07:00.000Z');
      const result = util.roundTimeQuarterHour(d);
      expect(result.getUTCMinutes() % 15).toBe(0);
    });
  });

  describe('setCoordinateFormat / getCoordinateFormat', () => {
    it('sets valid format', () => {
      util.setCoordinateFormat('latlon-dms');
      expect(safeLocalStorage.setItem).toHaveBeenCalledWith('COORDINATE_FORMAT', 'latlon-dms');
    });
    it('throws on invalid format', () => {
      expect(() => util.setCoordinateFormat('invalid')).toThrow();
    });
    it('returns stored format', () => {
      safeLocalStorage.getItem.mockReturnValue('latlon-dms');
      expect(util.getCoordinateFormat()).toBe('latlon-dms');
    });
    it('defaults to latlon-dd when no stored value', () => {
      safeLocalStorage.getItem.mockReturnValue(null);
      expect(util.getCoordinateFormat()).toBe('latlon-dd');
    });
  });

  describe('formatCoordinate', () => {
    it('formats as decimal degrees by default', () => {
      safeLocalStorage.getItem.mockReturnValue(null);
      expect(util.formatCoordinate([10.1234, 20.5678])).toBe('20.5678°, 10.1234°');
    });
    it('formats as DMS', () => {
      const result = util.formatCoordinate([0, 0], 'latlon-dms');
      expect(result).toContain('°');
    });
    it('formats as DM', () => {
      const result = util.formatCoordinate([0, 0], 'latlon-dm');
      expect(result).toContain('°');
    });
  });

  describe('now', () => {
    it('returns date approximately 40 minutes behind current time', () => {
      const before = Date.now();
      const result = util.now().getTime();
      const after = Date.now();
      const offset = 40 * 60000;
      expect(result).toBeGreaterThanOrEqual(before - offset - 100);
      expect(result).toBeLessThanOrEqual(after - offset + 100);
    });
  });

  describe('yesterday', () => {
    it('returns date one day before now', () => {
      const result = util.yesterday();
      const now = util.now();
      expect(now.getTime() - result.getTime()).toBeGreaterThanOrEqual(86400000 - 1000);
    });
  });

  describe('wrap', () => {
    it('returns function result on success', () => {
      const wrapped = util.wrap((x) => x * 2);
      expect(wrapped(5)).toBe(10);
    });
    it('catches and logs errors', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const wrapped = util.wrap(() => { throw new Error('oops'); });
      wrapped();
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('errorReport', () => {
    it('logs each error with cause', () => {
      const warnSpy = jest.spyOn(util, 'warn').mockImplementation(() => {});
      util.errorReport([{ message: 'Error1', cause: 'reason' }, { message: 'Error2' }]);
      expect(warnSpy).toHaveBeenCalledWith('Error1: reason');
      expect(warnSpy).toHaveBeenCalledWith('Error2');
      warnSpy.mockRestore();
    });
  });

  describe('getTextWidth', () => {
    it('returns measured text width', () => {
      const mockMeasure = jest.fn().mockReturnValue({ width: 42 });
      jest.spyOn(document, 'createElement').mockReturnValue({
        getContext: () => ({ measureText: mockMeasure, font: '' }),
      });
      expect(util.getTextWidth('hello', '14px Arial')).toBe(42);
    });
  });

  describe('earliestValidDate', () => {
    it('returns the input date if after earliest valid', () => {
      const d = new Date('2020-01-01');
      expect(util.earliestValidDate(d).getUTCFullYear()).toBe(2020);
    });
    it('returns earliest valid date if before', () => {
      const d = new Date('1900-01-01');
      expect(util.earliestValidDate(d).getUTCFullYear()).toBe(1948);
    });
  });

  describe('fetch', () => {
    it('resolves with json on application/json mimeType', async () => {
      global.fetch = jest.fn().mockResolvedValue({ json: () => Promise.resolve({ ok: true }) });
      await expect(util.fetch('/url', 'application/json')).resolves.toEqual({ ok: true });
    });
    it('resolves with text for other mimeTypes', async () => {
      global.fetch = jest.fn().mockResolvedValue({ text: () => Promise.resolve('raw') });
      await expect(util.fetch('/url', 'text/plain')).resolves.toBe('raw');
    });
    it('rejects on fetch error', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('fail'));
      await expect(util.fetch('/url')).rejects.toThrow('fail');
    });
  });

  describe('get', () => {
    it('resolves on 200 status', async () => {
      const mockXHR = {
        open: jest.fn(),
        send: jest.fn(),
        status: 200,
        response: 'data',
        onload: null,
        onerror: null,
      };
      jest.spyOn(global, 'XMLHttpRequest').mockImplementation(() => mockXHR);
      const promise = util.get('/url');
      mockXHR.onload();
      await expect(promise).resolves.toBe('data');
    });
    it('rejects on non-200 status', async () => {
      const mockXHR = {
        open: jest.fn(),
        send: jest.fn(),
        status: 404,
        statusText: 'Not Found',
        onload: null,
        onerror: null,
      };
      jest.spyOn(global, 'XMLHttpRequest').mockImplementation(() => mockXHR);
      const promise = util.get('/url');
      mockXHR.onload();
      await expect(promise).rejects.toThrow('Not Found');
    });
    it('rejects on network error', async () => {
      const mockXHR = {
        open: jest.fn(),
        send: jest.fn(),
        onload: null,
        onerror: null,
      };
      jest.spyOn(global, 'XMLHttpRequest').mockImplementation(() => mockXHR);
      const promise = util.get('/url');
      mockXHR.onerror();
      await expect(promise).rejects.toThrow('Network Error');
    });
  });
});
