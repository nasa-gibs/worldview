import 'jquery-ui-bundle/jquery-ui';
import loadingIndicator from './indicator';

export default (function(self) {
  // Export other ui methods
  self.indicator = loadingIndicator;
  /**
   * General error handler.
   *
   * Displays a dialog box with the error message. If an exception object
   * is passed in, its contents will be printed to the console.
   *
   * @method error
   * @static
   *
   * @param {Exception} cause The exception object that caused the error
   */
  self.error = function(...args) {
    console.error(args);

    self.notify(
      "<div class='error-header'>"
        + 'An unexpected error has occurred'
        + '</div>'
        + "<div class='error-body'>Please reload the page and try "
        + 'again. If you continue to have problems, contact us at '
        + "<a href='mailto:@MAIL@'>"
        + '@MAIL@</a>'
        + '</div>',
      'Error',
    );
  };

  /**
   * Displays a message to the end user in a dialog box.
   *
   * @method notify
   * @static
   *
   * @param {string} message The message to display to the user.
   *
   * @param [title="Notice"] {string} Title for the dialog box.
   */
  self.notify = function(message, title, width, callback) {
    const $dialog = self.getDialog();
    title = title || 'Notice';
    width = width || 300;
    $dialog
      .html(message)
      .dialog({
        title,
        width,
        minHeight: 1,
        height: 'auto',
        show: {
          effect: 'fade',
          duration: 400,
        },
        hide: {
          effect: 'fade',
          duration: 200,
        },
        closeText: '',
      })
      .on('dialogclose', function() {
        $(this).off('dialogclose');
        if (callback) {
          callback();
        }
      });
  };

  const getComponent = function(marker) {
    const $element = $('<div></div>').addClass(marker);
    $('body').append($element);
    return $element;
  };

  const closeComponent = function(marker, fnClose) {
    const selector = `.${marker}`;
    const $element = $(selector);
    if ($element.length !== 0) {
      fnClose($element);
    }
  };

  const closeDialog = function($element) {
    if ($element.length !== 0) {
      if ($element.dialog) {
        $element.dialog('close');
      }
      $element.remove();
    }
  };

  const closeMenu = function($element) {
    if ($element.length !== 0) {
      $element.remove();
    }
  };

  self.close = function() {
    closeComponent('wv-dialog', closeDialog);
    closeComponent('wv-menu', closeMenu);
  };

  self.getDialog = function(marker) {
    self.close(marker);
    return getComponent(marker || 'wv-dialog', closeDialog);
  };

  return self;
}({}));
