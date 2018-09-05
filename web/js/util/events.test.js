import { events } from './events';

test('triggers an event', () => {
  let e = events();
  let listener1 = jest.fn();
  let listener2 = jest.fn();
  e.on('test', listener1);
  e.on('test', listener2);
  e.trigger('test', 'a', 2);
  expect(listener1).toBeCalledWith('a', 2);
  expect(listener2).toBeCalledWith('a', 2);
});

test('null listener', () => {
  let e = events();
  expect(() => e.on('foo')).toThrow();
});

test('removes listener', () => {
  let e = events();
  let listener = jest.fn();
  e.on('test', listener);
  e.trigger('test');
  e.off('test', listener);
  e.trigger('test');
  expect(listener).toHaveBeenCalledTimes(1);
});

test('any listener called on any event', () => {
  let e = events();
  let listener = jest.fn();
  e.on('event1', listener);
  e.on('event2', listener);
  e.trigger('event1');
  e.trigger('event2');
  expect(listener).toHaveBeenCalledTimes(2);
});
