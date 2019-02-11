import jQuery from 'jquery';
import { linkModel } from './model';
import util from '../util/util';

var unmocked = {};

beforeAll(() => {
  unmocked.getJSON = jQuery.getJSON;
});

afterEach(() => {
  jQuery.getJSON = unmocked.getJSON;
});

test('query string from registered components', () => {
  let c1 = {
    save: function (state) {
      state.foo = 1;
    }
  };
  let c2 = {
    save: function (state) {
      state.bar = 2;
    }
  };
  let model = linkModel();
  model.register(c1);
  model.register(c2);

  expect(model.toQueryString()).toBe('foo=1&bar=2');
});

test('values encoded', () => {
  let c1 = {
    save: function (state) {
      state.foo = '?';
    }
  };
  let model = linkModel();
  model.register(c1);

  expect(model.toQueryString()).toBe('foo=%3F');
});

test('exceptions not encoded', () => {
  var c1 = {
    save: function (state) {
      state.foo = ',';
    }
  };
  let model = linkModel();
  model.register(c1);

  expect(model.toQueryString()).toBe('foo=,');
});

test('shorten calls cgi script', async () => {
  jQuery.getJSON = jest.fn(() => {
    return jQuery.Deferred()
      .resolve({
        data: {
          url: 'shorten'
        }
      });
  });

  let link = linkModel();
  let result = await link.shorten('foo').promise();

  expect(jQuery.getJSON).toHaveBeenCalledWith('service/link/shorten.cgi?url=foo');
  expect(result.data.url).toBe('shorten');
});

test('repeated call cached', async () => {
  jQuery.getJSON = jest.fn(() => {
    return jQuery.Deferred()
      .resolve({
        data: {
          url: 'shorten'
        }
      });
  });

  let link = linkModel();
  await link.shorten('foo').promise();
  await link.shorten('foo').promise();

  expect(jQuery.getJSON).toHaveBeenCalledTimes(1);
});

test('update on any event', () => {
  let c1 = {
    events: util.events()
  };
  let c2 = {
    events: util.events()
  };
  let link = linkModel();
  link.register(c1);
  link.register(c2);

  let call = jest.fn();
  link.events.on('update', call);
  c1.events.trigger('event');
  c2.events.trigger('event');

  expect(call).toHaveBeenCalledTimes(2);
});
