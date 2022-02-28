import events from './events';

test('triggers an event', () => {
  const listener1 = jest.fn();
  const listener2 = jest.fn();
  events.on('test', listener1);
  events.on('test', listener2);
  events.trigger('test', 'a', 2);
  expect(listener1).toBeCalledWith('a', 2);
  expect(listener2).toBeCalledWith('a', 2);
});

test('null listener', () => {
  expect(() => events.on('foo')).toThrow();
});

test('removes listener', () => {
  const listener = jest.fn();
  events.on('test', listener);
  events.trigger('test');
  events.off('test', listener);
  events.trigger('test');
  expect(listener).toHaveBeenCalledTimes(1);
});

test('any listener called on any event', () => {
  const listener = jest.fn();
  events.on('event1', listener);
  events.on('event2', listener);
  events.trigger('event1');
  events.trigger('event2');
  expect(listener).toHaveBeenCalledTimes(2);
});
