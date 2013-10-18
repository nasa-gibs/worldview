/*
 * NASA Worldview
 *
 * This code was originally developed at NASA/Goddard Space Flight Center for
 * the Earth Science Data and Information System (ESDIS) project.
 *
 * Copyright (C) 2013 United States Government as represented by the
 * Administrator of the National Aeronautics and Space Administration.
 * All Rights Reserved.
 */

/**
 * Namespace: Worldview.Permalink
 * Handles permalinks
 */
Worldview.namespace("Widget");

Worldview.Widget.Permalink = (function() {

    var permOverlay = null;

    var ns = {};

    /**
     * Function: show
     * Display a dialog box to the user showing the current permalink.
     */
    ns.show = function() {
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
            "</div>";
            permOverlay.setHeader("Permalink");
            permOverlay.setBody(item);
            permOverlay.render(document.body);
        }

        var link = Worldview.Permalink.get();
        $('#permalink_content').val(link);

        permOverlay.show();
        permOverlay.center();

        document.getElementById('permalink_content').focus();
        document.getElementById('permalink_content').select();
    };

    return ns;

})();
