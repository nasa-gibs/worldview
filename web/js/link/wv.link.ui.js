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
  var widgetFactory = React.createFactory(WVC.Link);

  var init = function() {
    var Widget;

    $button = $("<input></input>")
      .attr("type", "checkbox")
      .attr("id", "wv-link-button-check");
    $label = $("<label></label>")
      .attr("for", "wv-link-button-check")
      .attr("title", "Share this map");
    var $icon = $("<i></i>")
      .addClass("fa fa-share-square-o fa-2x");
    $label.append($icon);
    $(selector).append($label);
    $(selector).append($button);
    $button.button({
      text: false
    }).click(function() {
      var checked = $("#wv-link-button-check").prop("checked");
      WVC.GA.event('Link', 'Click', 'Share link Button');
      if ( checked ) {
        self.show();
      } else {
        wv.ui.closeDialog();
      }
    });

    models.link.events.on("update", replaceHistoryState);
  };

  self.show = function() {

    var $dialog = wv.ui.getDialog();
    Widget = self.initWidget();

    // Render Dialog Box Content
    self.reactComponent = ReactDOM.render(Widget, $dialog[0]);

    // If selected during the animation, the cursor will go to the
    // end of the input box
    var updateLink = function() {
      $('#permalink_content').val(models.link.get());
      $("#wv-link-shorten-check").prop('checked', false);
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
      width: 300,
      height: "auto",
      minHeight: 10,
      draggable: false,
      resizable: false,
      autoOpen: false
    }).on("dialogclose", function() {
      $("#wv-link-button-check").prop("checked", false);
      $button.button("refresh");
      models.link.events.off("update", updateLink);
    });
    wv.ui.positionDialog($dialog, {
      my: "left top",
      at: "left bottom+5",
      of: $label
    });
    $(".ui-dialog").zIndex(600);

    $('#permalink_content').val(models.link.get());
    $dialog.dialog("open");
    setTimeout(updateLink, 500);

    $("#wv-link-shorten-check").change(function(){
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
        $('#permalink_content').focus();
        $('#permalink_content').select();
      } else {
        $('#permalink_content').val(models.link.get());
        WVC.GA.event('Link', 'Check', 'Lengthen');
        $('#permalink_content').focus();
        $('#permalink_content').select();
      }
    });

    var error = function() {
      console.warn("Unable to shorten URL");
      console.warn.apply(console, arguments);
      wv.ui.notify("Unable to shorten the permalink at this time. " +
        "Please try again later.");
    };

    $("#wv-link-shorten-check").prop("checked", false);
  };

  self.initWidget = function() {
    // Check if URL Shortening is enabled in the config file.
    // TODO: Move this to wv-components so it can be accessed there.
    var urlShortening = config.features.urlShortening;
    return widgetFactory({
      urlShortening: urlShortening,
    });
  };

  //Calls toQueryString to fetch updated state and returns URL
  var replaceHistoryState = _.throttle(function() {
    if ( wv.util.browser.history ) {
      window.history.replaceState("", "@OFFICIAL_NAME@",
        "?" + models.link.toQueryString());
    }
  }, 2000, {leading: true, trailing: true});

  init();
  return self;

};
