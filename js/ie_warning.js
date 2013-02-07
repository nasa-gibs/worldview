window.onload = function() {

    // Test for IE and show warning, if necessary
    if (/MSIE (\d+\.\d+);/.test(navigator.userAgent))
    {
        var ieWarningOverlay = new YAHOO.widget.Panel("iewarning", { zIndex:1020, visible:false, underlay:"matte" } );
        var msg = "<div>" + 
            "<h4>Internet Explorer is not currently supported</h4>"+
            "<br /><p>Worldview uses a set of browser technologies that are not currently supported by Internet Explorer.  " +
            "We are awaiting the release of IE version 10 and are hopeful that it will load Worldview properly.  " +
            "In the meantime, please try loading this page in Mozilla Firefox, Google Chrome, Apple Safari, or a tablet device.  " +
            "<br /><br />Thanks for your patience.</p>" +
            "<br /><p>-The Worldview development team";
            
        ieWarningOverlay.setBody(msg);
        ieWarningOverlay.render(document.body);
        ieWarningOverlay.show();
        ieWarningOverlay.center();
    }
        
}
