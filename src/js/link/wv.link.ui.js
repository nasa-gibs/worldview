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

/**
 * @module wv.link
 */
var wv = wv || {};
wv.link = wv.link || {};

/**
 * Undocumented.
 *
 * @class wv.link.ui
 */
wv.link.ui = wv.link.ui || function(models) {

    var self = {};
    var id = "wv-link";
    var selector = "#" + id;
    var permOverlay = null;

    var init = function() {
        $(selector).click(function() {
            self.show();
        });
    };

    /**
     * @method show
     */
    self.show = function() {
        var link = models.link.get();

        if ( permOverlay === null ) {
            permOverlay = new YAHOO.widget.Panel("panel_perm", {
                width: "300px",
                zIndex: 1020,
                visible: false,
                constraintoviewport: true
            });
            var item =  "<div id='permpanel' >" +
                "<!-- <h3>Permalink:</h3> -->"+
                "<span style='font-weight:400; font-size:12px; line-spacing:24px;'>Copy and paste the following link to share this view:</span>" +
                "<input type='text' value='' name='permalink_content' id='permalink_content' />" +
                "<div><label id='wv-link-shorten-label'>Shorten this link</label><input type='checkbox' value='' name='wv-link-shorten-check' id='wv-link-shorten-check' /></div>" +
            "</div>";
            permOverlay.setHeader("Permalink");
            permOverlay.setBody(item);
            permOverlay.render(document.body);
            $("#wv-link-shorten-label").click(function() {
                var checked = $("#wv-link-shorten-check").prop("checked");
                $("#wv-link-shorten-check").prop("checked", !checked);
                update();
            });

            $("#wv-link-shorten-check").click(function() {
                update();
            });
        }

        var error = function() {
            permOverlay.hide();
            console.warn("Unable to shorten URL");
            console.warn.apply(console, arguments);
            wv.ui.notify("Unable to shorten the permalink at this time. " +
                    "Please try again later.");
        };

        var update = function() {
            var checked = $("#wv-link-shorten-check").prop("checked");
            if ( checked ) {
                var promise = models.link.shorten();
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
                $('#permalink_content').val(link);
            }
            document.getElementById('permalink_content').focus();
            document.getElementById('permalink_content').select();
        };

        $("#wv-link-shorten-check").prop("checked", false);
        permOverlay.show();
        permOverlay.center();
        update();
    };

    init();
    return self;

};
