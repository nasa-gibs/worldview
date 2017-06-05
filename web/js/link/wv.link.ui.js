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
    var $button;
    var $label;

    var init = function() {
        $button = $("<input></input>")
            .attr("type", "checkbox")
            .attr("id", "wv-link-button-check");
        $label = $("<label></label>")
            .attr("for", "wv-link-button-check")
            .attr("title", "Share this map");
        var $icon = $("<i></i>")
            .addClass("fa")
            .addClass("fa-share-square-o")
            .addClass("fa-2x");
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

    //Calls toQueryString to fetch updated state and returns URL
    var replaceHistoryState = _.throttle(function() {
        if ( wv.util.browser.history ) {
            window.history.replaceState("", "@OFFICIAL_NAME@",
                    "?" + models.link.toQueryString());
        }
    }, 2000, {leading: true, trailing: true});

    self.show = function() {
        var $dialog = wv.ui.getDialog();
        var item =  "<div id='wv-link' >" +
            "<input type='text' value='' name='permalink_content' id='permalink_content' readonly/>";
        if ( config.features.urlShortening ) {
            item += "<span autofocus></span><div id='wv-link-shorten'>" +
                "<input type='checkbox' value='' id='wv-link-shorten-check' />" +
                "<label id='wv-link-shorten-label' for='wv-link-shorten-check'>Shorten this link</label>" +
                "</div>";
        }
        item += "</div>";

        // Social Sharing
        var defaultLink = encodeURIComponent('http://worldview.earthdata.nasa.gov');
        var emailMessage = encodeURIComponent('Check out what I found in NASA\'s Worldview!');
        emailMessage = emailMessage.replace(/'/g, '%27');
        var twMessage = encodeURIComponent('Check out what I found in #NASAWorldview');
        var fbAppId = '121285908450463';
        var twitterHashTag = encodeURIComponent('#NASAWorldview');

        item += "<div id='social-share'>";

        // Facebook: https://developers.facebook.com/docs/sharing/reference/share-dialog#redirect
        item += "<a id='fb-share' class='icon-link fa fa-facebook fa-2x' href='https://www.facebook.com/dialog/share?" +
            "app_id=" + fbAppId +
            "&href=" + defaultLink +
            "&redirect_uri=" + defaultLink +
            "&display=popup' " +
            "target='_blank' " +
            "title='Share via Facebook!'></a>";

        // Twitter: https://dev.twitter.com/web/tweet-button/parameters#web-intent-example
        item += "<a id='tw-share' class='icon-link fa fa-twitter fa-2x' href='https://twitter.com/intent/tweet?" +
            "url=" + defaultLink +
            "&text=" + twMessage + "%20-' " +
            "target='_blank' " +
            "title='Share via Twitter!'></a>";

        // Google Plus: https://developers.google.com/+/web/share/#sharelink-endpoint
        item += "<a id='gp-share' class='icon-link fa fa-google-plus fa-2x' href='https://plus.google.com/share?" +
            "url=" + defaultLink + " '" +
            "target='_blank' " +
            "title='Share via Google Plus!'></a>";

        // Email
        item += "<a id='email-share' class='icon-link fa fa-envelope fa-2x' href='mailto:?" +
            "subject=" + emailMessage +
            "&body=" + emailMessage + "%20-%20" + defaultLink + " '" +
            "target='_self' " +
            "title='Share via Email!'></a>";

        item += "</div>";

        $dialog.html(item).iCheck({checkboxClass: 'icheckbox_square-grey'});

        // If selected during the animation, the cursor will go to the
        // end of the input box
        var updateLink  = function() {
            $('#permalink_content').val(models.link.get());
            $("#wv-link-shorten-check").iCheck("uncheck");
            $('#permalink_content').focus();
            $('#permalink_content').select();
        };

        models.link.events.on("update", updateLink);

        $dialog.dialog({
            dialogClass: "wv-panel",
            title: "Copy this link to share:",
            show: { effect: "slide", direction: "up" },
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
        // When an icon-link is clicked, replace the URL with current encoded link.
        $(".icon-link").on("click", function() {
            var fullEncodedLink = encodeURIComponent(models.link.get());
            var promise = models.link.shorten();

            // Set Facebook
            var fbLink = document.getElementById("fb-share");
            fbLink.setAttribute("href", "https://www.facebook.com/dialog/share?" +
                "app_id=" + fbAppId +
                "&href=" + fullEncodedLink +
                "&redirect_uri=" + fullEncodedLink +
                "&display=popup"
            );

            // Set Twitter
            var twLink = document.getElementById("tw-share");
            twLink.setAttribute("href", "https://twitter.com/intent/tweet?" +
                "url=" + fullEncodedLink +
                "&text=" + twMessage + "%20-"
            );

            // Set Google Plus
            var gpLink = document.getElementById("gp-share");
            gpLink.setAttribute("href", "https://plus.google.com/share?" +
                "url=" + fullEncodedLink
            );

            // Set Email
            var emailLink = document.getElementById("email-share");
            emailLink.setAttribute("href", "mailto:?" +
                "subject=" + emailMessage +
                "&body=" + emailMessage + "%20-%20" + fullEncodedLink
            );

            // If a short link can be generated, replace the full link.
            promise.done(function(result) {
                if ( result.status_code === 200 ) {
                    var shortLink = result.data.url;
                    var shortEncodedLink = encodeURIComponent(shortLink);

                    // Set Twitter
                    var twLink = document.getElementById("tw-share");
                    twLink.setAttribute("href", "https://twitter.com/intent/tweet?" +
                        "url=" + shortLink +
                        "&text=" + twMessage + "%20-"
                    );

                    // Set Email
                    var emailLink = document.getElementById("email-share");
                    emailLink.setAttribute("href", "mailto:?" +
                        "subject=" + emailMessage +
                        "&body=" + emailMessage + "%20-%20" + shortLink
                    );
                    return false;
                } else {
                    error(result.status_code, result.status_txt);
                }
            }).fail(function(jqXHR, textStatus, errorThrown) {
                error(textStatus, errorThrown);
            });
        });

        //$("#wv-link-shorten-check").button();
        $("#wv-link-shorten-check").on("ifChanged", function() {
            var checked = $("#wv-link-shorten-check").prop("checked");
            if ( checked ) {
                var promise = models.link.shorten();
                WVC.GA.event('Link', 'Check', 'Shorten');
                $("#permalink_content").val("Please wait...");
                promise.done(function(result) {
                    if ( result.status_code === 200 ) {
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

    init();
    return self;

};
