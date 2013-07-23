$(function() {
       
    var ns = Worldview.Palette;
   
    var onLoad = function(config) {
        var palettes = [];
        var canvas = document.createElement("canvas");
        canvas.width = 100;
        canvas.height = 14;
        
        $.each(config.palettes, function(name, p) {
            if ( p.source === "stock" ) {
                var cb = Worldview.Palette.ColorBar({canvas: canvas, palette: p});
                p.image = cb.toImage();
                palettes.push(p);
            }       
        });
   
        var paletteSelector = ns.PaletteSelector({
            selector: "#palette-selector",
            palettes: palettes
        });
       
        $("#set-selected-index").click(function() {
            paletteSelector.select($("#selected-index").val());
                return false;   
        });
           
        paletteSelector.addSelectionListener(function(palette) {
            console.log(palette); 
        });
    }
   
   var onError = function(cause) {
       Worldview.error("Unable to load palettes from the server", cause);
   }
   
    $.getJSON("../../../data/config", onLoad)
            .error(Worldview.ajaxError(onError));
    
});
