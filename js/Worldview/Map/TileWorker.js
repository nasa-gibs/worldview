
importScripts("TileRenderer.js");

var handleEvent = function(event) {
    var message = event.data.message;
    var lookupTable = message.lookupTable;
    var source = message.source;
    var destination = message.destination;
        
    Worldview.Map.TileRenderer.renderLookup(lookupTable, source, destination);
    
    /*
    for ( var i = 0; i < pixels.length; i += 4 ) {
        var lookup = pixels[i + 0] + "," + 
                     pixels[i + 1] + "," + 
                     pixels[i + 2] + "," + 
                     pixels[i + 3];
        var color = lookupTable[lookup];
        if ( color ) {
            pixels[i + 0] = color.r
            pixels[i + 1] = color.g
            pixels[i + 2] = color.b
            pixels[i + 3] = 0xff;
        }
    }
    */
    self.postMessage(event.data);
};

self.addEventListener("message", function(event) {
    handleEvent(event);
}, false);

