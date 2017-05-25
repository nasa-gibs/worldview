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

        // social sharing
        var baselink = 'https://worldview.earthdata.nasa.gov/';
        var fbAppId = 'yourFacebookAppId';
        var fbMessage = "Share this on facebook!";

        item += "<div id='social-share'>";
            // Facebook
            // https://www.facebook.com/dialog/feed?app_id=yourFacebookAppId&display=popup&caption=React%20Social!&link=https%3A%2F%2Fgithub.com%2Folahol%2Freact-social%2F&picture=&redirect_uri=https%3A%2F%2Fwww.facebook.com%2F
            // https://www.facebook.com/dialog/feed?
            // app_id=145634995501895
            // &display=popup&amp;caption=An%20example%20caption
            // &link=https%3A%2F%2Fdevelopers.facebook.com%2Fdocs%2F
            // &redirect_uri=https://developers.facebook.com/tools/explorer
            item += "<a class='' href='' target='' title='Share via Facebook!'><i class='fa fa-facebook-square'></i></a>";

            // Twitter
            item += "<a class='' href='' target='' title='Share via Twitter!'><i class='fa fa-twitter-square'></i></a>";

            // Google Plus
            item += "<a class='' href='' target='' title='Share via Google Plus!'><i class='fa fa-google-plus-square'></i></a>";

            // Email
            item += "<a class='' href='' target='' title='Share via Email!'><i class='fa fa-envelope-square'></i></a>";
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

        // function ShareInit() {
        //
        //     class ShareApp extends React.Component {
        //         render() {
        //
        //             return React.createElement('div', {},
        //             // facebook
        //             // https://www.facebook.com/dialog/feed?app_id=yourFacebookAppId&display=popup&caption=React%20Social!&link=https%3A%2F%2Fgithub.com%2Folahol%2Freact-social%2F&picture=&redirect_uri=https%3A%2F%2Fwww.facebook.com%2F
        //             // https://www.facebook.com/dialog/feed?
        //             // app_id=145634995501895
        //             // &display=popup&amp;caption=An%20example%20caption
        //             // &link=https%3A%2F%2Fdevelopers.facebook.com%2Fdocs%2F
        //             // &redirect_uri=https://developers.facebook.com/tools/explorer
        //
        //             React.createElement("a", {href: this.props.link, title: "Share via Facebook"},
        //                 React.createElement("i", {className: "fa fa-facebook-square"})
        //             ),
        //
        //             // twitter
        //             // https://twitter.com/intent/tweet?text=React%20Social!%20https%3A%2F%2Fgithub.com%2Folahol%2Freact-social%2F
        //             React.createElement("a", {href: this.props.link, title: "Share via Facebook"},
        //                 React.createElement("i", {className: "fa fa-twitter-square"})
        //             ),
        //
        //             // google plus
        //             React.createElement("a", {href: this.props.link, title: "Share via Facebook"},
        //                 React.createElement("i", {className: "fa fa-google-plus-square"})
        //             ),
        //
        //             // email
        //             React.createElement("a", {href: this.props.link, title: "Share via Facebook"},
        //                 React.createElement("i", {className: "fa fa-envelope-square"})
        //             ));
        //         }
        //     }
        //
        //     ReactDOM.render(React.createElement(ShareApp,
        //         {link: 'https://worldview.earthdata.nasa.gov/'},
        //         {facebookAppId: "yourFacebookAppId"},
        //         {message: "React Social!"}),
        //     $('#wv-link-shorten')[0]);
        // }
        // ShareInit();

    };

    init();
    return self;

};
