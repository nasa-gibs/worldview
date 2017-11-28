buster.testCase('wv.link.model', {

  'Query string from registered components': function () {
    var c1 = {
      save: function (state) {
        state.foo = 1;
      }
    };
    var c2 = {
      save: function (state) {
        state.bar = 2;
      }
    };
    var model = wv.link.model();
    model.register(c1)
      .register(c2);
    buster.assert.equals(model.toQueryString(), 'foo=1&bar=2');
  },

  'Values encoded': function () {
    var c1 = {
      save: function (state) {
        state.foo = '?';
      }
    };
    var model = wv.link.model();
    model.register(c1);
    buster.assert.equals(model.toQueryString(), 'foo=%3F');
  },

  'Exceptions not encoded': function () {
    var c1 = {
      save: function (state) {
        state.foo = ',';
      }
    };
    var model = wv.link.model();
    model.register(c1);
    buster.assert.equals(model.toQueryString(), 'foo=,');
  },

  'Shorten calls cgi script': function (done) {
    var link = wv.link.model();
    var call = this.stub(jQuery, 'getJSON');
    call.returns(jQuery.Deferred()
      .resolve({
        data: {
          url: 'shorten'
        }
      }));
    var promise = link.shorten('foo');
    promise.done(function (result) {
      buster.assert.calledWith(call, 'service/link/shorten.cgi?url=foo');
      buster.assert.equals(result.data.url, 'shorten');
      done();
    });
  },

  'Repeated call cached': function (done) {
    var link = wv.link.model();
    var call = this.stub(jQuery, 'getJSON');
    call.returns(jQuery.Deferred()
      .resolve({
        data: {
          url: 'shorten'
        }
      }));
    link.shorten('foo');
    var promise = link.shorten('foo');
    promise.done(function (result) {
      buster.assert.equals(result.data.url, 'shorten');
      buster.assert.calledOnce(call);
      done();
    });
  },

  'Update on any event': function () {
    var c1 = {
      events: wv.util.events()
    };
    var c2 = {
      events: wv.util.events()
    };
    var link = wv.link.model();
    link.register(c1);
    link.register(c2);
    var call = this.stub();
    link.events.on('update', call);
    c1.events.trigger('event');
    c2.events.trigger('event');
    buster.assert.calledTwice(call);
  }

});
