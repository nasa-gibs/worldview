/* global feedback */

/* The feedback global variable is defined by
 * https://fbm.earthdata.nasa.gov/for/worldview/feedback.js
 * which is included via config.scripts in web/config/wv.json
*/
import util from './util/util';

export default function feedbackUi() {
  const self = {};
  let feedbackInit = false;

  self.showFeedback = function() {
    if (!util.browser.small && window.feedback) {
      if (!feedbackInit) {
        feedback.init({
          showIcon: false,
        });
      }
      feedback.showForm();
      feedbackInit = true;
    } else {
      window.location.href = 'mailto:@MAIL@?subject=Feedback for @LONG_NAME@ tool';
    }
  };
  return self;
}
