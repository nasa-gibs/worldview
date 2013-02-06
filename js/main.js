window.onload = function(){// Initialize "static" vars

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

    this.selector = new YAHOO.widget.Panel("selector", { zIndex:1019, visible:false } );
    this.selector.setBody("<div id='selectorbox'></div>");
    this.selector.render(document.body);
    var sel_id = this.selector.id;
    this.selector.beforeHideEvent.subscribe(function(e){ $("#"+sel_id).css("display","none");})
    this.selector.beforeShowEvent.subscribe(function(e){$("#"+sel_id).css("display","block");})

    // Create map 
    var m = new SOTE.widget.MapSote("map",{baseLayer:"MODIS_Terra_CorrectedReflectance_TrueColor"});
    var ss = new SOTE.widget.Switch("switch",{dataSourceUrl:"a",selected:"geographic"});
    var a = new SOTE.widget.Bank("products",{dataSourceUrl:"ap_products.php",title:"My Layers",selected:{antarctic:"baselayers.MODIS_Terra_CorrectedReflectance_TrueColor~overlays.antarctic_coastlines", arctic:"baselayers.MODIS_Terra_CorrectedReflectance_TrueColor~overlays.arctic_coastlines",geographic:"baselayers.MODIS_Terra_CorrectedReflectance_TrueColor~overlays.sedac_bound"},categories:["Base Layers","Overlays"],callback:this.showSelector,selector:this.selector});
    var s = new SOTE.widget.Selector("selectorbox",{dataSourceUrl:"ap_products.php",categories:["Base Layers","Overlays"]});
    //var h = new SOTE.widget.MenuPicker("hazard",{dataSourceUrl:"data/mp_hazard.php"});
    //var tr = new SOTE.widget.MenuPicker("transition",{dataSourceUrl:"data/mp_transition.php"});
    var map = new SOTE.widget.DateSpan("time",{hasThumbnail:false});
    //Image download variables
    rb = new SOTE.widget.RubberBand("camera",{icon:"images/camera.png",onicon:"images/cameraon.png",cropee:"map"});
    var id = new SOTE.widget.ImageDownload("imagedownload",{baseLayer:"MODIS_Terra_CorrectedReflectance_TrueColor",alignTo: rb, m:m});

};
