import lodashThrottle from 'lodash/throttle';
import util from '../util/util';

export function linkUi(models, config) {
  var self = {};

  var init = function() {
    models.link.events.on('update', replaceHistoryState);
  };

  // Calls toQueryString to fetch updated state and returns URL
  var replaceHistoryState = lodashThrottle(
    function() {
      if (util.browser.history) {
        window.history.replaceState(
          '',
          '@OFFICIAL_NAME@',
          '?' + models.link.toQueryString()
        );
      }
    },
    2000,
    {
      leading: true,
      trailing: true
    }
  );

  init();
  return self;
}
