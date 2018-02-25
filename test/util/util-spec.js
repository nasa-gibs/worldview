buster.testCase('wv.util', (function () {
  var self = {};

  self['fromQueryString: Empty object when there is no query string'] = function () {
    buster.assert.equals(wv.util.fromQueryString(''), {});
  };

  self['fromQueryString: Values are parsed correctly'] = function () {
    var x = wv.util.fromQueryString('?foo=a&bar=b');
    buster.assert.equals('a', x.foo);
    buster.assert.equals('b', x.bar);
  };

  self['fromQueryString: Does not need a leading ?'] = function () {
    var x = wv.util.fromQueryString('foo=a&bar=b');
    buster.assert.equals('a', x.foo);
    buster.assert.equals('b', x.bar);
  };

  self['fromQueryString: Escaped values are converted'] = function () {
    var x = wv.util.fromQueryString('foo=image%2fjpeg');
    buster.assert.equals('image/jpeg', x.foo);
  };

  self['toQueryString: Empty string with no values'] = function () {
    buster.assert.equals(wv.util.toQueryString({}), '');
  };

  self['toQueryString: Converts object to string'] = function () {
    var qs = wv.util.toQueryString({
      foo: 'a',
      bar: 'b'
    });
    buster.assert.equals(qs, '?foo=a&bar=b');
  };

  self['toQueryString: Encodes value'] = function () {
    var qs = wv.util.toQueryString({
      format: 'image/png'
    });
    buster.assert.equals(qs, '?format=image%2Fpng');
  };

  self['toQueryString: Exception not encoded'] = function () {
    var qs = wv.util.toQueryString({
      format: 'image/png'
    }, ['%2f']);
    buster.assert.equals(qs, '?format=image/png');
  };

  self['toQueryString: Multiple exceptions not encoded'] = function () {
    var qs = wv.util.toQueryString({
      format: '/image/png/'
    }, ['%2f']);
    buster.assert.equals(qs, '?format=/image/png/');
  };

  self['parseTimestampUTC: Parses valid timestamp'] = function () {
    var answer = new Date(Date.UTC(2013, 2, 15, 11, 22, 33));
    var result = wv.util.parseTimestampUTC('2013-03-15T11:22:33Z');
    buster.assert.equals(result.getTime(), answer.getTime());
  };

  self['parseTimestampUTC: Parses valid timestamp without Z'] = function () {
    var answer = new Date(Date.UTC(2013, 2, 15, 11, 22, 33));
    var result = wv.util.parseTimestampUTC('2013-03-15T11:22:33');
    buster.assert.equals(result.getTime(), answer.getTime());
  };

  self['parseDateUTC: Parses valid date'] = function () {
    var answer = new Date(Date.UTC(2013, 2, 15));
    var result = wv.util.parseDateUTC('2013-03-15');
    buster.assert.equals(result.getTime(), answer.getTime());
  };

  self['parseDateUTC: Exception on invalid date'] = function () {
    buster.assert.exception(function () {
      wv.util.parseDateUTC('x');
    });
  };

  self['toISOStringDate: Converts date'] = function () {
    var d = new Date(Date.UTC(2013, 0, 15));
    buster.assert.equals(wv.util.toISOStringDate(d), '2013-01-15');
  };

  self['toISOStringMinutes: Converts time'] = function () {
    var d = new Date(Date.UTC(2013, 0, 15, 11, 22, 33));
    buster.assert.equals(wv.util.toISOStringMinutes(d), '11:22');
  };

  self['toISOStringSeconds: Converts time'] = function () {
    var d = new Date(Date.UTC(2013, 0, 15, 11, 22, 33));
    buster.assert.equals(wv.util.toISOStringSeconds(d), '11:22:33');
  };

  self['toCompactTimestamp: Converts timestamp'] = function () {
    var d = new Date(Date.UTC(2013, 0, 15, 11, 22, 33, 444));
    buster.assert.equals(wv.util.toCompactTimestamp(d),
      '20130115112233444');
  };

  self['fromCompactTimestamp: Parses timestamp'] = function () {
    var answer = new Date(Date.UTC(2013, 0, 15, 11, 22, 33, 444));
    var result = wv.util.fromCompactTimestamp('20130115112233444');
    buster.assert.equals(answer.getTime(), result.getTime());
  };

  self['fromCompactTimestamp: Throws exception when invalid'] = function () {
    var answer = new Date(Date.UTC(2013, 0, 15, 11, 22, 33, 444));
    buster.assert.exception(function () {
      wv.util.fromCompactTimestamp('x0130115112233444');
    });
  };

  self['clearTimeUTC: Time set to UTC midnight'] = function () {
    var d = new Date(2013, 2, 15, 12, 34, 56, 789);
    wv.util.clearTimeUTC(d);
    buster.assert.equals(2013, d.getUTCFullYear());
    buster.assert.equals(2, d.getUTCMonth());
    buster.assert.equals(15, d.getUTCDate());
    buster.assert.equals(0, d.getUTCHours());
    buster.assert.equals(0, d.getUTCMinutes());
    buster.assert.equals(0, d.getUTCSeconds());
  };

  self['ajaxCache: Non-cached request returned'] = function (done) {
    this.stub(jQuery, 'ajax')
      .returns(jQuery.Deferred()
        .resolve('answer'));
    var cache = wv.util.ajaxCache();
    var promise = cache.submit({
      url: 'url',
      data: 'foo=bar'
    })
      .done(function (data) {
        buster.assert.equals(data, 'answer');
        done();
      });
  };

  self['wrap: Correclty invokes function'] = function () {
    var func = this.stub()
      .returns('answer');
    var wrap = wv.util.wrap(func);
    var answer = wrap(1, 2);
    buster.assert.equals(answer, 'answer');
    buster.assert.calledWith(func, 1, 2);
  };

  self['wrap: Invokes error handler on exception'] = function () {
    var func = this.stub()
      .throws();
    this.stub(wv.util, 'error');
    var wrap = wv.util.wrap(func);
    wrap();
    buster.assert.called(wv.util.error);
  };

  self['dateAdd: Adds days'] = function () {
    var d = new Date(2011, 1, 1);
    var result = wv.util.dateAdd(d, 'day', 4);
    buster.assert.equals(result.getDate(), 5);
  };

  self['dateAdd: Adds months'] = function () {
    var d = new Date(2011, 1, 1);
    var result = wv.util.dateAdd(d, 'month', 4);
    buster.assert.equals(result.getMonth(), 5);
  };

  self['dateAdd: Adds years'] = function () {
    var d = new Date(2011, 1, 1);
    var result = wv.util.dateAdd(d, 'year', 4);
    buster.assert.equals(result.getFullYear(), 2015);
  };

  self['dateAdd: Throws error on invalid interval'] = function () {
    var d = new Date(2011, 1, 1);
    buster.assert.exception(function () {
      wv.util.dateAdd(d, 'foo', 5);
    });
  };

  self['daysInMonth: Feb, non-leap'] = function () {
    var d = new Date(2015, 1, 15);
    buster.assert.equals(wv.util.daysInMonth(d), 28);
  };

  self['daysInMonth: Feb, leap'] = function () {
    var d = new Date(2016, 1, 15);
    buster.assert.equals(wv.util.daysInMonth(d), 29);
  };

  self['clamp: middle'] = function () {
    buster.assert.equals(wv.util.clamp(15, 10, 20), 15);
  };

  self['clamp: min'] = function () {
    buster.assert.equals(wv.util.clamp(8, 10, 20), 10);
  };

  self['clamp: max'] = function () {
    buster.assert.equals(wv.util.clamp(22, 10, 20), 20);
  };

  self['roll: middle'] = function () {
    buster.assert.equals(wv.util.roll(15, 10, 20), 15);
  };

  self['roll: min'] = function () {
    buster.assert.equals(wv.util.roll(8, 10, 20), 19);
  };

  self['roll: max'] = function () {
    buster.assert.equals(wv.util.roll(22, 10, 20), 11);
  };

  self['rollDate: Day up'] = function () {
    var d = new Date(Date.UTC(2014, 1, 15));
    d = wv.util.rollDate(d, 'day', 1);
    buster.assert.equals(d, new Date(Date.UTC(2014, 1, 16)));
  };

  self['rollDate: Day up, roll'] = function () {
    var d = new Date(Date.UTC(2014, 1, 28));
    d = wv.util.rollDate(d, 'day', 1);
    buster.assert.equals(d, new Date(Date.UTC(2014, 1, 1)));
  };

  self['rollDate: Day down'] = function () {
    var d = new Date(Date.UTC(2014, 1, 15));
    d = wv.util.rollDate(d, 'day', -1);
    buster.assert.equals(d, new Date(Date.UTC(2014, 1, 14)));
  };

  self['rollDate: Day down, roll'] = function () {
    var d = new Date(Date.UTC(2014, 1, 1));
    d = wv.util.rollDate(d, 'day', -1);
    buster.assert.equals(d, new Date(Date.UTC(2014, 1, 28)));
  };

  self['rollDate: Day up, roll over max'] = function () {
    var maxDate = new Date(Date.UTC(2014, 11, 2));
    var d = new Date(Date.UTC(2014, 11, 2));
    d = wv.util.rollDate(d, 'day', 1, null, maxDate);
    buster.assert.equals(d, new Date(Date.UTC(2014, 11, 1)));
  };

  self['rollDate: Day down, roll over max'] = function () {
    var maxDate = new Date(Date.UTC(2014, 11, 2));
    var d = new Date(Date.UTC(2014, 11, 1));
    d = wv.util.rollDate(d, 'day', -1, null, maxDate);
    buster.assert.equals(d, new Date(Date.UTC(2014, 11, 2)));
  };

  self['rollDate: Day up, roll over min'] = function () {
    var minDate = new Date(Date.UTC(2014, 11, 2));
    var d = new Date(Date.UTC(2014, 11, 31));
    d = wv.util.rollDate(d, 'day', 1, minDate);
    buster.assert.equals(d, new Date(Date.UTC(2014, 11, 2)));
  };

  self['rollDate: Day down, roll over min'] = function () {
    var minDate = new Date(Date.UTC(2014, 11, 2));
    var d = new Date(Date.UTC(2014, 11, 2));
    d = wv.util.rollDate(d, 'day', -1, minDate);
    buster.assert.equals(d, new Date(Date.UTC(2014, 11, 31)));
  };

  self['rollDate: Month up'] = function () {
    var d = new Date(Date.UTC(2014, 5, 15));
    d = wv.util.rollDate(d, 'month', 1);
    buster.assert.equals(d, new Date(Date.UTC(2014, 6, 15)));
  };

  self['rollDate: Month up, roll'] = function () {
    var d = new Date(Date.UTC(2014, 11, 15));
    d = wv.util.rollDate(d, 'month', 1);
    buster.assert.equals(d, new Date(Date.UTC(2014, 0, 15)));
  };

  self['rollDate: Month down'] = function () {
    var d = new Date(Date.UTC(2014, 5, 15));
    d = wv.util.rollDate(d, 'month', -1);
    buster.assert.equals(d, new Date(Date.UTC(2014, 4, 15)));
  };

  self['rollDate: Month down, roll'] = function () {
    var d = new Date(Date.UTC(2014, 0, 15));
    d = wv.util.rollDate(d, 'month', -1);
    buster.assert.equals(d, new Date(Date.UTC(2014, 11, 15)));
  };

  self['rollDate: Month up, roll over max'] = function () {
    var maxDate = new Date(Date.UTC(2014, 10, 2));
    var d = new Date(Date.UTC(2014, 9, 20));
    d = wv.util.rollDate(d, 'month', 1, null, maxDate);
    buster.assert.equals(d, new Date(Date.UTC(2014, 10, 2)));
  };

  self['rollDate: Month up, roll past max'] = function () {
    var maxDate = new Date(Date.UTC(2014, 10, 2));
    var d = new Date(Date.UTC(2014, 10, 1));
    d = wv.util.rollDate(d, 'month', 1, null, maxDate);
    buster.assert.equals(d, new Date(Date.UTC(2014, 0, 1)));
  };

  self['rollDate: Month down, roll over max'] = function () {
    var maxDate = new Date(Date.UTC(2014, 10, 2));
    var d = new Date(Date.UTC(2014, 0, 20));
    d = wv.util.rollDate(d, 'month', -1, null, maxDate);
    buster.assert.equals(d, new Date(Date.UTC(2014, 10, 2)));
  };

  self['rollDate: Month up, truncate day'] = function () {
    var d = new Date(Date.UTC(2014, 0, 31));
    d = wv.util.rollDate(d, 'month', 1);
    buster.assert.equals(d, new Date(Date.UTC(2014, 1, 28)));
  };

  self['rollDate: Month down, roll over min'] = function () {
    var minDate = new Date(Date.UTC(2014, 2, 25));
    var d = new Date(Date.UTC(2014, 3, 1));
    d = wv.util.rollDate(d, 'month', -1, minDate);
    buster.assert.equals(d, new Date(Date.UTC(2014, 2, 25)));
  };

  self['rollDate: Month up, roll over min'] = function () {
    var minDate = new Date(Date.UTC(2014, 2, 25));
    var d = new Date(Date.UTC(2014, 11, 1));
    d = wv.util.rollDate(d, 'month', 1, minDate);
    buster.assert.equals(d, new Date(Date.UTC(2014, 2, 25)));
  };

  self['rollDate: Month down, roll past min'] = function () {
    var minDate = new Date(Date.UTC(2014, 2, 25));
    var d = new Date(Date.UTC(2014, 2, 27));
    d = wv.util.rollDate(d, 'month', -1, minDate);
    buster.assert.equals(d, new Date(Date.UTC(2014, 11, 27)));
  };

  self['rollDate: Year up'] = function () {
    var d = new Date(Date.UTC(2014, 5, 15));
    d = wv.util.rollDate(d, 'year', 1);
    buster.assert.equals(d, new Date(Date.UTC(2015, 5, 15)));
  };

  self['rollDate: Year down'] = function () {
    var d = new Date(Date.UTC(2014, 5, 15));
    d = wv.util.rollDate(d, 'year', -1);
    buster.assert.equals(d, new Date(Date.UTC(2013, 5, 15)));
  };

  self['rollDate: Year up, roll over max'] = function () {
    var minDate = new Date(Date.UTC(2000, 3, 12));
    var maxDate = new Date(Date.UTC(2015, 6, 16));
    var d = new Date(Date.UTC(2015, 0, 1));
    d = wv.util.rollDate(d, 'year', 1, minDate, maxDate);
    buster.assert.equals(d, new Date(Date.UTC(2000, 3, 12)));
  };

  self['rollDate: Year down, roll over min'] = function () {
    var minDate = new Date(Date.UTC(2000, 3, 12));
    var maxDate = new Date(Date.UTC(2015, 6, 16));
    var d = new Date(Date.UTC(2000, 8, 1));
    d = wv.util.rollDate(d, 'year', -1, minDate, maxDate);
    buster.assert.equals(d, new Date(Date.UTC(2015, 6, 16)));
  };

  self['formatDMS: zero'] = function () {
    var lat = wv.util.formatDMS(0, 'latitude');
    var lon = wv.util.formatDMS(0, 'longitude');
    buster.assert.equals(' 0&deg;00\'00"N', lat);
    buster.assert.equals('  0&deg;00\'00"E', lon);
  };

  self['formatDMS: positive'] = function () {
    var lat = wv.util.formatDMS(12.582222, 'latitude');
    var lon = wv.util.formatDMS(12.582222, 'longitude');
    buster.assert.equals('12&deg;34\'55"N', lat);
    buster.assert.equals(' 12&deg;34\'55"E', lon);
  };

  self['formatDMS: negative'] = function () {
    var lat = wv.util.formatDMS(-12.582222, 'latitude');
    var lon = wv.util.formatDMS(-12.582222, 'longitude');
    buster.assert.equals('12&deg;34\'55"S', lat);
    buster.assert.equals(' 12&deg;34\'55"W', lon);
  };

  self['formatDMS: max'] = function () {
    var lat = wv.util.formatDMS(89.999997, 'latitude');
    var lon = wv.util.formatDMS(179.999997, 'longitude');
    buster.assert.equals('89&deg;59\'59"N', lat);
    buster.assert.equals('179&deg;59\'59"E', lon);
  };

  return self;
}()));
