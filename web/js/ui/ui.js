import $ from 'jquery';
import 'jquery-ui/dialog';
import 'jquery-ui/menu';
import 'jquery-ui/position';
import loadingIndicator from './indicator';
import info from './info';
import mouse from './mouse';

export default (function (self) {
  // Export other ui methods
  self.loadingIndicator = loadingIndicator;
  self.info = info;
  self.mouse = mouse;
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
  self.error = function () {
    console.error.apply(console, arguments);

    self.notify(
      '<div class=\'error-header\'>' +
      '<i class=\'error-icon fa fa-exclamation-triangle fa-3x\'></i>' +
      'An unexpected error has occurred' +
      '</div>' +
      '<div class=\'error-body\'>Please reload the page and try ' +
      'again. If you continue to have problems, contact us at ' +
      '<a href=\'mailto:@MAIL@\'>' +
      '@MAIL@</a>' +
      '</div>', 'Error'
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
  self.notify = function (message, title, width, callback) {
    var $dialog = self.getDialog();
    title = title || 'Notice';
    width = width || 300;
    $dialog.html(message)
      .dialog({
        title: title,
        width: width,
        minHeight: 1,
        height: 'auto',
        show: {
          effect: 'fade',
          duration: 400
        },
        hide: {
          effect: 'fade',
          duration: 200
        }
      })
      .on('dialogclose', function () {
        $(this)
          .off('dialogclose');
        if (callback) {
          callback();
        }
      });
  };

  self.alert = function (body, title, size, glyph, closeFn) {
    var $message = $('<span/>', { class: 'notify-message' });
    var $icon = $('<i/>', { class: 'fa fa-' + glyph + ' fa-1x', title: title });
    var $messageWrapper = $('<div/>').click(function () {
      self.notify(body, title, size);
    }).append($icon).append($message);
    var $close = $('<i/>', { class: 'fa fa-times fa-1x' }).click(closeFn);
    var $alert = $('<div/>').append($close).append($messageWrapper).dialog({
      autoOpen: false,
      resizable: false,
      height: 40,
      width: 420,
      draggable: false,
      show: {
        effect: 'fade',
        duration: 400
      },
      hide: {
        effect: 'fade',
        duration: 200
      },
      dialogClass: 'no-titlebar notify-alert'
    });
    $message.empty().append(title);
    return $alert;
  };

  /**
   * Asks the end user a yes or no question in a dialog box.
   *
   * @method ask
   * @static
   *
   * @param [spec.header="Notice"] {string} Header text to be displayed in
   * the dialog box.
   *
   * @param [spec.message="Are you sure?"] {string} Message text to be
   * displayed in the dialog box.
   *
   * @param [spec.okButton="OK"] {string} Text to be used in the no button.
   *
   * @param [spec.cancelButton="Cancel"] {string} Text to be used in the yes
   * button.
   *
   * @param [spec.onOk] {function} Function to execute when the OK button is
   * pressed. If not specified, the dialog box simply closes.
   *
   * @parma [spec.onCancel] {function} Function to execute when the Cancel
   * button is pressed. If not specified, the dialog box simply closes.
   */
  self.ask = function (spec) {
    var $dialog = self.getDialog('wv-dialog-ask');
    var cancelText = spec.cancelButton || 'Cancel';
    var okText = spec.okButton || 'OK';
    var buttons = {};
    buttons[cancelText] = function () {
      $(this)
        .dialog('close');
      if (spec.onCancel) {
        spec.onCancel();
      }
    };
    buttons[okText] = function () {
      $(this)
        .dialog('close');
      if (spec.onOk) {
        spec.onOk();
      }
    };
    $dialog.dialog({
      title: spec.header || 'Notice',
      resizable: false,
      modal: true,
      buttons: buttons
    })
      .html(spec.message)
      .on('dialogclose', function () {
        if (spec.onCancel) {
          spec.onCancel();
        }
      });
  };

  /**
   * Displays a message to the end user that the feature is not supported
   * in this web browser.
   *
   * @method unsupported
   * @static
   *
   * @param {String} [featureName] If specified, the message will state
   * "The <featureName> feature is not supported...". Otherwise  it will
   * state "This feature..."
   */
  self.unsupported = function (featureName) {
    var prefix;
    if (!featureName) {
      prefix = 'This feature';
    } else {
      prefix = 'The ' + featureName + ' feature';
    }
    self.notify(prefix + ' is not supported with your web ' +
      'browser. Upgrade or try again in a different browser.');
  };

  var getComponent = function (marker) {
    var $element = $('<div></div>')
      .addClass(marker);
    $('body')
      .append($element);
    return $element;
  };

  var closeComponent = function (marker, fnClose) {
    var selector = '.' + marker;
    var $element = $(selector);
    if ($element.length !== 0) {
      fnClose($element);
    }
  };

  var closeDialog = function ($element) {
    if ($element.length !== 0) {
      if ($element.dialog) {
        $element.dialog('close');
      }
      $element.remove();
    }
  };

  var closeMenu = function ($element) {
    if ($element.length !== 0) {
      $element.remove();
    }
  };

  self.close = function () {
    closeComponent('wv-dialog', closeDialog);
    closeComponent('wv-menu', closeMenu);
  };

  self.getDialog = function (marker) {
    self.close(marker);
    return getComponent(marker || 'wv-dialog', closeDialog);
  };

  self.getMenu = function (marker) {
    self.close();
    return getComponent(marker || 'wv-menu', closeMenu);
  };

  self.closeDialog = function () {
    self.close();
  };

  self.positionMenu = function ($menuItems, pos) {
    var position = function () {
      $menuItems.menu()
        .position(pos);
    };
    position();
    $(window)
      .resize(position);
    $menuItems.on('hide', function () {
      $(window)
        .off('resize', position);
    });
  };

  self.positionDialog = function ($dialog, pos) {
    var position = function () {
      $dialog.dialog('option', 'position', pos);
    };
    position();
    $(window)
      .resize(position);
    $dialog.on('dialogclose', function () {
      $(window)
        .off('resize', position);
    });
  };

  return self;
})({});
