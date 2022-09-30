const skipTour = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');

const {
  mobileAnimateButton,
  mobileAnimationWidget,
} = localSelectors;

const TIME_LIMIT = 1000;

module.exports = {
  before(c) {
    skipTour.loadAndSkipTour(c, TIME_LIMIT);
    c.url(`${c.globals.url}'?v=-82.73697802714918,27.137724977419197,-71.17181984959728,52.16591344371096&lg=false&t=2022-01-07-T15%3A27%3A49Z`);
    c.setWindowSize(748, 1024); // iPad Mini dimensions
  },

  'Mobile animate button opens widget': (c) => {
    c.useCss().click(mobileAnimateButton);
    c.waitForElementVisible(mobileAnimationWidget, (el) => {
    c.expect.element('.custom-interval-delta-input').to.have.value.that.equals('1');
    c.expect.element('.dropdown-toggle').text.to.equal('DAY');
    });
  },

  'Minimizing mobile animation widget opens collapsed animation widget': (c) => {
    c.useCss().click('.wv-minimize');
    c.waitForElementVisible('#collapsed-animate-widget-tablet-portrait', TIME_LIMIT);
  },

  'Playing the animation changes the date of the mobile date picker': (c) => {
    c.useCss().click('#collapsed-animate-widget-tablet-portrait');
    c.pause(1000);
    c.expect.element('.mobile-date-picker-select-btn-text span').text.to.equal('2022 JAN 17');
  },

  'Pressing the animation button brings up the mobile animation widget with the same information': (c) => {
    c.useCss().click(mobileAnimateButton);
    c.waitForElementVisible(mobileAnimationWidget, TIME_LIMIT, (el) => {
      c.expect.element('#mobile-animation-start-date .mobile-date-picker-select-btn span').text.to.equal('2022 JAN 07');
      c.expect.element('#mobile-animation-end-date .mobile-date-picker-select-btn span').text.to.equal('2022 JAN 17');
      });
  },

  after(c) {
    c.end();
  },
};
