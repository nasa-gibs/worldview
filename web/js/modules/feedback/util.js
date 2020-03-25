/* global feedback */

/* The feedback global variable is defined by
 * https://fbm.earthdata.nasa.gov/for/worldview/feedback.js
 * which is included via config.scripts in web/config/wv.json
 */

import util from '../../util/util';

export default function onClickFeedback(wasInitiated) {
  if (!util.browser.small && window.feedback) {
    // eslint-disable-next-line no-restricted-globals
    event.preventDefault();
    if (!wasInitiated) {
      feedback.init({
        showIcon: false,
      });
    }
    feedback.showForm();
  }
}
