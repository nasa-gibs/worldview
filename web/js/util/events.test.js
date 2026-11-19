import events from './events';

test('triggers an event', () => {
  const listener1 = jest.fn();
  const listener2 = jest.fn();
  events.on('test', listener1);
  events.on('test', listener2);
  events.trigger('test', 'a', 2);
  expect(listener1).toHaveBeenCalledWith('a', 2);
  expect(listener2).toHaveBeenCalledWith('a', 2);
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

describe('self.any()', () => {
  it('throws when no callback is provided', () => {
    expect(() => events.any()).toThrow('No listener specified');
  });

  it('throws when callback is null', () => {
    expect(() => events.any(null)).toThrow('No listener specified');
  });

  it('registers a listener that is called on any trigger', () => {
    const listener = jest.fn();
    events.any(listener);
    events.trigger('someEvent', 'arg1');
    expect(listener).toHaveBeenCalledWith('arg1');
  });
});

describe('self.trigger() — allListeners', () => {
  it('calls all-listeners registered via any() with trigger arguments', () => {
    const listener = jest.fn();
    events.any(listener);
    events.trigger('anotherEvent', 'x', 'y');
    expect(listener).toHaveBeenCalledWith('x', 'y');
  });

  it('calls multiple any-listeners on trigger', () => {
    const listener1 = jest.fn();
    const listener2 = jest.fn();
    events.any(listener1);
    events.any(listener2);
    events.trigger('multiEvent');
    expect(listener1).toHaveBeenCalled();
    expect(listener2).toHaveBeenCalled();
  });
});
