const reuseables = require('../../reuseables/skip-tour.js');
const localSelectors = require('../../reuseables/selectors.js');

const {
  infoToolbarButton,
} = localSelectors;

const TIME_LIMIT = 5000;
const settingsInfoItem = '#settings_info_item';
const globalSettingsModal = '#global_settings_modal';
const globalSettingsTemperatureButtons = '.temperature-unit-buttons';

module.exports = {
  before: (c) => {
    reuseables.loadAndSkipTour(c, TIME_LIMIT);
  },

  'Global settings menu item opens global settings modal': (c) => {
    c.expect.element(infoToolbarButton).to.be.present;
    c.click(infoToolbarButton);

    c.waitForElementVisible(settingsInfoItem, TIME_LIMIT);
    c.click(settingsInfoItem);

    c.waitForElementVisible(globalSettingsModal);
    c.pause(500);

    c.expect.element(globalSettingsModal).to.be.present;
    c.expect.element(globalSettingsTemperatureButtons).to.be.present;
  },

  after: (c) => {
    c.end();
  },
};
