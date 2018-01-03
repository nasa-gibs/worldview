/* global feedback */

/* The feedback global variable is defined by
 * https://fbm.earthdata.nasa.gov/for/worldview/feedback.js
 * which is included via config.scripts in web/config/wv.json
*/

import util from './util/util';

export default (function () {
  var self = {};
  var feedbackInit = false;

  self.decorate = function ($element) {
    $element.attr('href',
      'mailto:@MAIL@?subject=Feedback for @LONG_NAME@ tool');

    $element.click(function (event) {
      if (!util.browser.small && window.feedback) {
        event.preventDefault();
        if (!feedbackInit) {
          feedback.init({
            showIcon: false
          });
        }
        feedback.showForm();
        feedbackInit = true;
      }
    });
  };

  return self;
})();
