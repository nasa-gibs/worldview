$(function() {
       
   var ns = Worldview.Visual;
   
   var onLoad = function(palettes) {
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
   
   ns.stockPaletteEndpoint = "../../../data/palettes";
   ns.loadStockPalettes(onLoad, onError);   
    
});
