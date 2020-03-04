/* global feedback */

/* The feedback global variable is defined by
 * https://fbm.earthdata.nasa.gov/for/worldview/feedback.js
 * which is included via config.scripts in web/config/wv.json
 */

import util from '../../util/util';

export function onClickFeedback(wasInitiated) {
  if (!util.browser.small && window.feedback) {
    event.preventDefault();
    if (!wasInitiated) {
      feedback.init({
        showIcon: false,
      });
    }
    feedback.showForm();
  }
}
