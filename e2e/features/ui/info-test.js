const reuseables = require('../../reuseables/skip-tour.js')
const localSelectors = require('../../reuseables/selectors.js')

const {
  infoToolbarButton
} = localSelectors

const TIME_LIMIT = 5000

module.exports = {
  before: (c) => {
    reuseables.loadAndSkipTour(c, TIME_LIMIT)
  },

  // verify info toolbar is visible and contains valid menu items
  'Info toolbar is visible and contains valid menu items': (c) => {
    c.expect.element(infoToolbarButton).to.be.present
    c.click(infoToolbarButton)

    c.waitForElementVisible('#toolbar_info', TIME_LIMIT)
    c.expect.element('#send_feedback_info_item').to.be.present
    c.expect.element('#start_tour_info_item').to.be.present
    c.expect.element('#settings_info_item').to.be.present
    c.expect.element('#about_info_item').to.be.present
    c.expect.element('#distraction_free_info_item').to.be.present
  },

  // verify about menu item opens about modal
  'About menu item opens about modal': (c) => {
    c.click('#about_info_item')
    c.pause(500)

    c.expect.element('.about-page').to.be.present
    c.expect.element('a[href="mailto:ryan.a.boller@nasa.gov"]').to.be.visible
  },

  after: (c) => {
    c.end()
  }

}
