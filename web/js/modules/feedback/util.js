/* global feedback */
/* The feedback global variable is defined by
 * https://fbm.earthdata.nasa.gov/for/worldview/feedback.js
 * which is included via config.scripts in web/config/wv.json
 */

export default function onClickFeedback(wasInitiated, isMobile) {
  if (!isMobile && window.feedback) {
    if (!wasInitiated) {
      feedback.init({
        showIcon: false,
      });
    }
    feedback.showForm();
  }
}
