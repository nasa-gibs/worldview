const skipTour = require('../../reuseables/skip-tour.js');
const localQueryStrings = require('../../reuseables/querystrings.js');
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
    c.setWindowSize(500, 800);
  },
  //verify that mobile animation button opens mobile animation widget
  'Mobile animate button opens widget': (c) => {
    c.useCss().click(mobileAnimateButton);
    c.pause(100000);


  },

  after(c) {
    c.end();
  },
};
