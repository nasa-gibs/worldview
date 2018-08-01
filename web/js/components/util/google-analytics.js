/* eslint-disable */

export default {
  /*
  * Initialize GA tracking if tracking
  * code is present
  *
  * @func init
  * @static
  *
  * @param Category {id} GA tracking code
  *
  * @return {void}
  */
  init(id) {
    if(id) {
      (function(i, s, o, g, r, a, m) {
        i['GoogleAnalyticsObject']=r;
        i[r]=i[r]||function() {
          (i[r].q=i[r].q||[]).push(arguments);
        },
        i[r].l=1*new Date();
        a=s.createElement(o),
        m=s.getElementsByTagName(o)[0];
        a.async=1;
        a.src=g;
        m.parentNode.insertBefore(a, m);
      })(window, document, 'script', 'https://www.google-analytics.com/analytics.js', 'ga');
      ga('create', id, 'auto');
      ga('send', 'pageview');
    }
  },

  /*
  * @func TrackEventGA
  * @static
  *
  * @param Category {string} Event group name
  * @param Action {string} Type of user interaction
  * @param Label {string} Optional string for better verification of the event
  * @param Value {number} Optional number to associate with event
  *
  * @return {void}
  */
  event(category, action, label, value) {
    if (typeof (ga) !== 'undefined') {
      ga('send', 'event', category, action, label, value);
    }
  }
};
