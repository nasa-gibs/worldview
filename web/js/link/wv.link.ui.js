/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 - 2014 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

var wv = wv || {};
wv.link = wv.link || {};

wv.link.ui = wv.link.ui || function(models, config) {

  var self = {};
  var id = "wv-link-button";
  var selector = "#" + id;
  var $button, $label;
  var fbLink, twLink, rdLink, emailLink;
  var widgetFactory = React.createFactory(WVC.Link);

  var init = function() {
    $button = $("<input></input>").attr("type", "checkbox").attr("id", "wv-link-button-check");
    $label = $("<label></label>").attr("for", "wv-link-button-check").attr("title", "Share this map");
    var $icon = $("<i></i>").addClass("fa fa-share-square-o fa-2x");
    $label.append($icon);
    $(selector).append($label);
    $(selector).append($button);
    $button.button({text: false}).click(function() {
      var checked = $("#wv-link-button-check").prop("checked");
      WVC.GA.event('Link', 'Click', 'Share link Button');
      if (checked) {
        self.show();
      } else {
        wv.ui.closeDialog();
      }
    });

    models.link.events.on("update", replaceHistoryState);
  };

  //Calls toQueryString to fetch updated state and returns URL
  var replaceHistoryState = _.throttle(function() {
    if (wv.util.browser.history) {
      window.history.replaceState("", "@OFFICIAL_NAME@", "?" + models.link.toQueryString());
    }
  }, 2000, {
    leading: true,
    trailing: true
  });

  // Facebook: https://developers.facebook.com/docs/sharing/reference/share-dialog#redirect
  var facebookUrlParams = function(appId, href, redirectUri, display) {
    return "https://www.facebook.com/dialog/share?" + "app_id=" + encodeURIComponent(appId) + "&href=" + encodeURIComponent(href) + "&redirect_uri=" + encodeURIComponent(redirectUri) + "&display=" + encodeURIComponent(display);
  };

  // Twitter: https://dev.twitter.com/web/tweet-button/parameters#web-intent-example
  var twitterUrlParams = function(url, text) {
    return "https://twitter.com/intent/tweet?" + "url=" + encodeURIComponent(url) + "&text=" + encodeURIComponent(text);
  };

  // Reddit: https://www.reddit.com/r/nasa/submit?url=[URL]&title=[TITLE]
  var redditUrlParams = function(url, title) {
    return "https://www.reddit.com/r/nasa/submit?" + "url=" + encodeURIComponent(url) + "&title=" + encodeURIComponent(title);
  };

  // Email: mailto:?subject=[SUBJECT]&body=[BODY]
  var emailUrlParams = function(subject, body) {
    return "mailto:?" + "subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
  };

  self.setLink = function(fbLink, twLink, rdLink, emailLink, callback) {
    var fb, tw, rd, email;
    var promise = models.link.shorten();
    var shareMessage = 'Check out what I found in NASA Worldview!';
    var twMessage = 'Check out what I found in #NASAWorldview -';
    var emailBody = shareMessage + " - " + models.link.get();
    var shortLink = models.link.get();

    // If a short link can be generated, replace the full link.
    promise.done(function(result) {
      if (result.status_code === 200) {
        emailBody = shareMessage + " - " + result.data.url;
        shortLink = result.data.url;

        callback(fb, tw, rd, email);
      }
    }).fail(function() {
      console.warn("Unable to shorten URL, full link generated.");
    });

    fb = facebookUrlParams('121285908450463', models.link.get(), models.link.get(), 'popup');
    tw = twitterUrlParams(shortLink, twMessage);
    rd = redditUrlParams(models.link.get(), shareMessage);
    email = emailUrlParams(shareMessage, emailBody);

    callback(fb, tw, rd, email);
  };

  self.show = function() {
    var $dialog = wv.ui.getDialog();
    var item =  "<div id='wv-link' class='wv-link'>" +
        "<input type='text' value='' name='permalink_content' id='permalink_content' readonly/>";
    if ( config.features.urlShortening ) {
        item += "<span autofocus></span><div id='wv-link-shorten'>" +
            "<input type='checkbox' value='' id='wv-link-shorten-check' />" +
            "<label id='wv-link-shorten-label' for='wv-link-shorten-check'>Shorten this link</label>" +
            "</div>";
    }
    item += "</div>";
    var dialogWidth = '300';
    if ( wv.util.browser.small ) {
      dialogWidth = '242';
    }

    Widget = self.initWidget();

    // Render Dialog Box Content
    self.reactComponent = ReactDOM.render(Widget, $dialog[0]);

    // Update react link states when dialog is shown.
    self.setLink(fbLink, twLink, rdLink, emailLink, self.reactComponent.updateLinkState);

    // If selected during the animation, the cursor will go to the
    // end of the input box
    var updateLink = function() {
      $('#permalink_content').val(models.link.get());
      $("#wv-link-shorten-check").iCheck("uncheck");
      $('#permalink_content').focus();
      $('#permalink_content').select();
    };

    models.link.events.on("update", updateLink);

    $dialog.dialog({
      dialogClass: "wv-panel wv-link-panel",
      title: "Copy this link to share:",
      show: {
        effect: "slide",
        direction: "up"
      },
      width: dialogWidth,
      height: "auto",
      minHeight: 10,
      draggable: false,
      resizable: false,
      autoOpen: false
    }).on("dialogcreate",
      $dialog.prepend(item)
    ).on("dialogclose", function() {
      $("#wv-link-button-check").prop("checked", false);
      $button.button("refresh");
      models.link.events.off("update", updateLink);
    });
    if ( wv.util.browser.small ) {
      wv.ui.positionDialog($dialog, {
          my: "left top",
          at: "left+58 bottom+5",
          of: "#wv-toolbar"
      });
    } else {
      wv.ui.positionDialog($dialog, {
          my: "left top",
          at: "left bottom+5",
          of: $label
      });
    }
    $(".ui-dialog").zIndex(600);

    $('#permalink_content').val(models.link.get());
    $dialog.dialog("open");
    setTimeout(updateLink, 500);

    $("#wv-link-shorten-check").on("change", function() {
      var checked = $("#wv-link-shorten-check").prop("checked");
      if (checked) {
        var promise = models.link.shorten();
        WVC.GA.event('Link', 'Check', 'Shorten');
        $("#permalink_content").val("Please wait...");
        promise.done(function(result) {
          if (result.status_code === 200) {
            $('#permalink_content').val(result.data.url);
          } else {
            error(result.status_code, result.status_txt);
          }
        }).fail(function(jqXHR, textStatus, errorThrown) {
          error(textStatus, errorThrown);
        });
      } else {
        $('#permalink_content').val(models.link.get());
        WVC.GA.event('Link', 'Check', 'Lengthen');
      }
      $('#permalink_content').focus();
      $('#permalink_content').select();
    });

    var error = function() {
      console.warn("Unable to shorten URL");
      console.warn.apply(console, arguments);
      wv.ui.notify("Unable to shorten the permalink at this time. " +
        "Please try again later.");
    };

    $("#wv-link-shorten-check").prop("checked", false);
  };

  // Update react link states when share buttons are clicked.
  // Prepare link and then click to ensure shortener promise has ran.
  self.clickFunction = function() {
    var linkReady;
    var waitUntil = Date.now() + 200;
    while (Date.now() < waitUntil) {
      if (!linkReady) {
        linkReady = true;
        self.setLink(fbLink, twLink, rdLink, emailLink, self.reactComponent.updateLinkState);
        $('#permalink_content').val(models.link.get());
        $("#wv-link-shorten-check").iCheck("uncheck");
        $('#permalink_content').focus();
        $('#permalink_content').select();
      }
    }
  };

  self.initWidget = function() {
    return widgetFactory({
      clickFunction: self.clickFunction
    });
  };

  init();
  return self;

};
