const { client } = require('nightwatch-cucumber');
const { defineSupportCode } = require('cucumber');

defineSupportCode(({ Then }) => {
  Then('the animation range selector works', () => {
    return client
      .getValue('.wv-anim-dates-case .wv-date-selector-widget:first-child #day-input-group', function (result) {
        var startDay = result.value;
        client
          .useCss()
          .moveToElement('#wv-timeline-range-selector:first-child polygon', 1, 1)
          .mouseButtonDown(0)
          .moveTo(null, -40, 0)
          .mouseButtonUp(0)
          .pause(100);
        client.getValue('.wv-anim-dates-case .wv-date-selector-widget:first-child #day-input-group', function (result) {
          var newDay = result.value;
          this.assert.notEqual(startDay, newDay);
        });
      });
  });
});
