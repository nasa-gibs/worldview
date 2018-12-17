import util from '../util/util';
import wvui from '../ui/ui';
var compareAlertBody =
  '<h3 class="compare-dialog-header">What can I compare?</h3>' +
  '<ul>' +
  '<li>The same imagery at different times.</li>' +
  '<li>The same time with different imagery products</li>' +
  '<li>A mix of different times and layers</li>' +
  '</ul>' +
  '<p>You can toggle between three different comparison modes found at the base of the sidebar</p>' +
  '<ul>' +
  '<li>Swipe</li>' +
  '<li>Opacity</li>' +
  '<li>Spy</li>' +
  '</ul>';

export function compareUi(models, ui, config) {
  var self = {};
  var alertDialog;

  var alert = function() {
    if (!alertDialog) {
      alertDialog = wvui.alert(
        compareAlertBody,
        'You are in comparison mode',
        800,
        'warning',
        function() {
          if (util.browser.localStorage) {
            localStorage.setItem('dismissedCompareAlert', true);
          }
          alertDialog.dialog('close');
        }
      );
    }
    if (
      util.browser.localStorage &&
      !localStorage.getItem('dismissedCompareAlert')
    ) {
      alertDialog.dialog('open');
    }
  };
  var init = function() {
    var model = models.compare;
    if (model.active) alert();
    model.events.on('toggle', function() {
      if (model.active) alert();
    });
  };
  init();
  return self;
}
