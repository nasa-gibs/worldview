import $ from 'jquery';
import 'jquery-ui/button';
import 'jquery-ui/dialog';
import 'icheck';
import lodashThrottle from 'lodash/throttle';
import React from 'react';
import ReactDOM from 'react-dom';
import Clipboard from 'clipboard';
import { Share, GA as googleAnalytics } from 'worldview-components';
import util from '../util/util';
import wvui from '../ui/ui';

export function linkUi(models, config) {
  var self = {};
  var id = 'wv-link-button';
  var selector = '#' + id;
  var $button, $label;
  var clipboard = new Clipboard('.copy-btn');

  var init = function () {
    $button = $('<input></input>')
      .attr('type', 'checkbox')
      .attr('id', 'wv-link-button-check');
    $label = $('<label></label>')
      .attr('for', 'wv-link-button-check')
      .attr('title', 'Share this map');
    var $icon = $('<i></i>')
      .addClass('fa fa-share-square-o fa-2x');
    $label.append($icon);
    $(selector)
      .append($label);
    $(selector)
      .append($button);
    $button.button({
      text: false
    })
      .click(function () {
        var checked = $('#wv-link-button-check')
          .prop('checked');
        googleAnalytics.event('Link', 'Click', 'Share link Button');
        if (checked) {
          self.show();
        } else {
          wvui.closeDialog();
        }
      });
    models.link.events.on('update', replaceHistoryState);
  };

  // Calls toQueryString to fetch updated state and returns URL
  var replaceHistoryState = lodashThrottle(function () {
    if (util.browser.history) {
      window.history.replaceState('', '@OFFICIAL_NAME@', '?' + models.link.toQueryString());
    }
  }, 2000, {
    leading: true,
    trailing: true
  });

  // Facebook: https://developers.facebook.com/docs/sharing/reference/share-dialog#redirect
  var facebookUrlParams = function (appId, href, redirectUri, display) {
    return 'https://www.facebook.com/dialog/share?' + 'app_id=' + encodeURIComponent(appId) + '&href=' + encodeURIComponent(href) + '&redirect_uri=' + encodeURIComponent(redirectUri) + '&display=' + encodeURIComponent(display);
  };

  // Twitter: https://dev.twitter.com/web/tweet-button/parameters#web-intent-example
  var twitterUrlParams = function (url, text) {
    return 'https://twitter.com/intent/tweet?' + 'url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text);
  };

  // Reddit: https://www.reddit.com/r/nasa/submit?url=[URL]&title=[TITLE]
  var redditUrlParams = function (url, title) {
    return 'https://www.reddit.com/r/nasa/submit?' + 'url=' + encodeURIComponent(url) + '&title=' + encodeURIComponent(title);
  };

  // Email: mailto:?subject=[SUBJECT]&body=[BODY]
  var emailUrlParams = function (subject, body) {
    return 'mailto:?' + 'subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  };

  var getSharelink = function (type, url) {
    var shareMessage = 'Check out what I found in NASA Worldview!';
    var twMessage = 'Check out what I found in #NASAWorldview -';
    var emailBody = shareMessage + ' - ' + url;

    switch (type) {
      case 'twitter':
        return twitterUrlParams(url, twMessage);
      case 'facebook':
        return facebookUrlParams('121285908450463', url, url, 'popup');
      case 'reddit':
        return redditUrlParams(url, shareMessage);
      case 'email':
        return emailUrlParams(shareMessage, emailBody);
    }
    return undefined;
  };
  var openPromisedSocial = function (url, win) {
    win.location.assign(url);
  };
  var clickFunction = function (type) {
    var href, win;
    var shareLink = models.link.get();
    var promise = models.link.shorten();

    // If a short link can be generated, replace the full link.
    if (type === 'twitter' || type === 'email') {
      win = window;
      if (type === 'twitter') {
        win = window.open('', '_blank');
      }
      promise.done(function (result) {
        if (result.status_code === 200) {
          href = getSharelink(type, result.data.url);
          openPromisedSocial(href, win);
        }
      })
        .fail(function () {
          href = getSharelink(type, shareLink);
          openPromisedSocial(href, win);
          console.warn('Unable to shorten URL, full link generated.');
        });
    } else {
      href = getSharelink(type, shareLink);
      window.open(href, '_blank');
    }
  };

  self.show = function () {
    var $dialog = wvui.getDialog();
    var item = '<div id=\'wv-link\' class=\'wv-link\'>' +
      '<div class=\'input-group\'>' +
      '<input type=\'text\' value=\'\' name=\'permalink_content\' id=\'permalink_content\' readonly/>' +
      '<span class=\'input-group-button hide-icon\' data-balloon-visible data-tooltip=\'Copied!\' data-tooltip-pos=\'up\' data-tooltip-length=\'xsmall\'>' +
      '<button title=\'Copy to clipboard\' class=\'copy-btn\' data-clipboard-target=\'#permalink_content\'>COPY</button>' +
      '</span>' +
      '</div>';
    if (config.features.urlShortening) {
      item += '<span autofocus></span><div id=\'wv-link-shorten\'>' +
        '<input type=\'checkbox\' value=\'\' id=\'wv-link-shorten-check\' />' +
        '<label id=\'wv-link-shorten-label\' for=\'wv-link-shorten-check\'>Shorten link</label>' +
        '</div>';
    }
    item += '</div>';

    var dialogWidth = '300';
    if (util.browser.small) {
      dialogWidth = '242';
    }

    var Widget = self.initWidget();

    // Render Dialog Box Content
    self.reactComponent = ReactDOM.render(Widget, $dialog[0]);

    // If selected during the animation, the cursor will go to the
    // end of the input box
    var updateLink = function () {
      $('#permalink_content')
        .val(models.link.get());
      $('#wv-link-shorten-check')
        .iCheck('uncheck');
      $('#permalink_content')
        .focus();
      $('#permalink_content')
        .select();
    };

    models.link.events.on('update', updateLink);

    $dialog.dialog({
      dialogClass: 'wv-panel wv-link-panel',
      title: 'Copy link to share:',
      show: {
        effect: 'slide',
        direction: 'up'
      },
      width: dialogWidth,
      height: 'auto',
      minHeight: 10,
      draggable: false,
      resizable: false,
      autoOpen: false
    })
      .on('dialogcreate',
        $dialog.prepend(item)
      )
      .on('dialogclose', function () {
        $('#wv-link-button-check')
          .prop('checked', false);
        $button.button('refresh');
        models.link.events.off('update', updateLink);
      });
    if (util.browser.small) {
      wvui.positionDialog($dialog, {
        my: 'right top',
        at: 'right-58 bottom+5',
        of: '#wv-toolbar'
      });
    } else {
      wvui.positionDialog($dialog, {
        my: 'right top',
        at: 'right bottom+5',
        of: $label
      });
    }
    $('.ui-dialog')
      .zIndex(600);

    $('#permalink_content')
      .val(models.link.get());
    $dialog.dialog('open');
    setTimeout(updateLink, 500);

    $('#wv-link-shorten-check')
      .on('change', function () {
        var checked = $('#wv-link-shorten-check')
          .prop('checked');
        if (checked) {
          var promise = models.link.shorten();
          googleAnalytics.event('Link', 'Check', 'Shorten');
          $('#permalink_content')
            .val('Please wait...');
          promise.done(function (result) {
            if (result.status_code === 200) {
              $('#permalink_content')
                .val(result.data.url);
            } else {
              error(result.status_code, result.status_txt);
            }
          })
            .fail(function (jqXHR, textStatus, errorThrown) {
              error(textStatus, errorThrown);
            });
        } else {
          $('#permalink_content')
            .val(models.link.get());
          googleAnalytics.event('Link', 'Check', 'Lengthen');
        }
        $('#permalink_content')
          .focus();
        $('#permalink_content')
          .select();
      });

    var error = function () {
      console.warn('Unable to shorten URL');
      console.warn.apply(console, arguments);
      wvui.notify('Unable to shorten the permalink at this time. ' +
        'Please try again later.');
    };

    $('#wv-link-shorten-check')
      .prop('checked', false);

    clipboard.on('success', function (e) {
      e.clearSelection();

      $('.wv-link .input-group-button')
        .removeClass('hide-icon');

      setTimeout(function () {
        $('.wv-link .input-group-button')
          .addClass('hide-icon');
      }, 1000);
    });

    clipboard.on('error', function (e) {
      console.error('Link could not be copied!');
      console.error('Action:', e.action);
      console.error('Trigger:', e.trigger);
    });
  };

  self.initWidget = function () {
    return React.createElement(Share, {
      clickFunction: clickFunction,
      fbLink: '#',
      twLink: '#',
      rdLink: '#',
      emailLink: '#'
    });
  };

  init();
  return self;
};
