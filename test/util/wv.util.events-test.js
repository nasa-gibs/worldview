buster.testCase('wv.util.events', {

  events: null,

  setUp: function () {
    this.events = wv.util.events();
  },

  'Triggers an event': function () {
    var listener1 = this.stub();
    var listener2 = this.stub();
    this.events.on('test', listener1);
    this.events.on('test', listener2);
    this.events.trigger('test', 'a', 2);
    buster.assert.calledWith(listener1, 'a', 2);
    buster.assert.calledWith(listener2, 'a', 2);
  },

  'Exception thrown when trying to register a null listener': function () {
    var self = this;
    buster.assert.exception(function () {
      self.events.on('foo');
    });
  },

  'Removes listener': function () {
    var listener = this.stub();
    this.events.on('test', listener);
    this.events.trigger('test');
    this.events.off('test', listener);
    this.events.trigger('test');
    buster.assert.calledOnce(listener);
  },

  'Any listener called on any event': function () {
    var listener = this.stub();
    this.events.on('event1', listener);
    this.events.on('event2', listener);
    this.events.trigger('event1');
    this.events.trigger('event2');
    buster.assert.calledTwice(listener);
  }
});
