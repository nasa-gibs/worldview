import util from '../util/util';
import wvui from '../ui/ui';
const compareAlertBody =
  '<div class="compare-dialog">' +
  '<p>How to get started?</p>' +
  '<ul>' +
  '<li class="compare-dialog-list-item"><p>Select the respective tab (A or B) in order to update the layers and date of that state.<p><img src="images/ab-tabs.png"/></li>' +
  '<li class="compare-dialog-list-item"><p>There are now two time sliders on the timeline. You can click on the deactivated time slider to activate that state and change the date.</p><img src="images/ab-picks.png"/></li>' +
  '<li class="compare-dialog-list-item"><p>There are three compare modes. You can choose different modes using the selection at the bottom of the layer list.</p><img src="images/ab-modes.png"/></li>' +
  '</ul></div>';

export function compareUi(models, ui, config) {
  var self = {};
  var alertDialog;

  var alert = function() {
    if (!localStorage.getItem('dismissedCompareAlert')) {
      if (!alertDialog) {
        alertDialog = wvui.alert(
          compareAlertBody,
          'You are now in comparison mode',
          800,
          'exclamation-triangle',
          'fas',
          function() {
            if (util.browser.localStorage) {
              localStorage.setItem('dismissedCompareAlert', true);
            }
            alertDialog.dialog('close');
          }
        );
      }
      alertDialog.dialog('open');
    }
  };
  var init = function() {
    var model = models.compare;
    if (util.browser.localStorage && !util.browser.mobileAndTabletDevice) {
      if (model.active) alert();

      model.events.on('toggle', function() {
        if (model.active) {
          alert();
        } else if (alertDialog) {
          alertDialog.dialog('close');
          alertDialog = null;
        }
      });
    }
  };
  init();
  return self;
}
