buster.testCase('wv.util.browser', {

  setUp: function () {},

  'Is Safari': function () {
    this.stub(wv.util.browser.tests, 'navigator')
      .returns({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_3) AppleWebKit/534.55.3 (KHTML, like Gecko) Version/5.1.3 Safari/534.53.10'
      });
    buster.assert(wv.util.browser.tests.safari());
  },

  'Is not Safari': function () {
    this.stub(wv.util.browser.tests, 'navigator')
      .returns({
        userAgent: 'Mozilla/5.0 (Windows NT 6.2; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/32.0.1667.0 Safari/537.36'
      });
    buster.refute(wv.util.browser.tests.safari());
  },

  'Safari version': function () {
    this.stub(wv.util.browser.tests, 'navigator')
      .returns({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_3) AppleWebKit/534.55.3 (KHTML, like Gecko) Version/5.1.3 Safari/534.53.10'
      });
    buster.assert.equals(wv.util.browser.tests.safariVersion(), 5);
  },

  'Is Internet Explorer': function () {
    this.stub(wv.util.browser.tests, 'navigator')
      .returns({
        userAgent: 'Mozilla/5.0 (MSIE 9.0; Windows NT 6.1; Trident/5.0)'
      });
    buster.assert(wv.util.browser.tests.ie());
  },

  'Is Internet Explorer 10': function () {
    this.stub(wv.util.browser.tests, 'navigator')
      .returns({
        userAgent: 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; Trident/6.0; SLCC2; .NET CLR 2.0.50727; .NET CLR 3.5.30729; .NET CLR 3.0.30729; Media Center PC 6.0; .NET4.0C)'
      });
    buster.assert(wv.util.browser.tests.ie());
  },

  'Is not Internet Explorer': function () {
    this.stub(wv.util.browser.tests, 'navigator')
      .returns({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.8; rv:26.0) Gecko/20100101 Firefox/26.0'
      });
    buster.refute(wv.util.browser.tests.ie());
  },

  'Internet Explorer version': function () {
    this.stub(wv.util.browser.tests, 'navigator')
      .returns({
        userAgent: 'Mozilla/5.0 (MSIE 9.0; Windows NT 6.1; Trident/5.0)'
      });
    buster.assert.equals(wv.util.browser.tests.ieVersion(), 9);
  },

  'CORS': function () {
    this.stub(wv.util.browser.tests, 'safari')
      .returns(true);
    this.stub(wv.util.browser.tests, 'safariVersion')
      .returns(7);
    buster.assert(wv.util.browser.tests.cors());
  },

  'Non-working CORS on Safari version <= 6': function () {
    this.stub(wv.util.browser.tests, 'safari')
      .returns(true);
    this.stub(wv.util.browser.tests, 'safariVersion')
      .returns(6);
    buster.refute(wv.util.browser.tests.cors());
  },

  'Web workers': function () {
    this.stub(wv.util.browser.tests, 'window')
      .returns({});
    buster.assert(wv.util.browser.tests.webWorkers());
  },

  'No web workers': function () {
    this.stub(wv.util.browser.tests, 'window')
      .returns(undefined);
    buster.refute(wv.util.browser.tests.webWorkers());
  },

  'Local storage': function () {
    buster.assert(wv.util.browser.tests.localStorage);
  },

  'No local storage': function () {
    this.stub(wv.util.browser.tests, 'window')
      .returns(undefined);
    buster.refute(wv.util.browser.tests.localStorage());
  },

  /* Does not work on Firefox
  "Disabled local storage": function() {
      this.stub(window.localStorage, "setItem", function() {
          throw new Error();
      });
      buster.refute(wv.util.browser.tests.localStorage());
  },
  */

  'Large device': function () {
    var dimensions = this.stub(
      wv.util.browser.tests,
      'getWindowDimensions'
    );
    dimensions.returns([1000, 1000]);
    buster.refute(wv.util.browser.tests.small());
    buster.refute(wv.util.browser.tests.constrained());
  },
  'Small device': function () {
    var dimensions = this.stub(
      wv.util.browser.tests,
      'getWindowDimensions'
    );
    dimensions.returns([200, 200]);
    buster.assert(wv.util.browser.tests.small());
  },
  'Constrained device, height': function () {
    var dimensions = this.stub(
      wv.util.browser.tests,
      'getWindowDimensions'
    );
    dimensions.returns([1000, 300]);
    buster.assert(wv.util.browser.tests.constrained());
  }
});
