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
 * Class: OpenLayers.Tile.Canvas 
 * 
 * Cavas based tile generator. The default tile generator, 
 * OpenLayers.Tile.Image renders each tile in an image element. This generator 
 * is simiar except that it uses canvas elements instead. This can be used in a 
 * layer by providing an instance at instantiation:
 *
 * (start code)
 * var myLayer = new OpenLayers.Layer.WMTS({
 *     name: "My Layer",
 *     tileClass: OpenLayers.Tile.Canvas, 
 *     ...
 * });
 * (end code)
 * 
 * To apply a lookup table to dynamically change the colors of the tile, 
 * set a lookupTable property in OpenLayers.Layer with a mapping of RGBA 
 * integer values to RGBA integer values. Example:
 * 
 * (start code)
 * var grn = { r: 0x00, g: 0xff, b: 0xff, a: 0xff };
 * var red = { r: 0xff, g: 0x00, b: 0x00, a: 0xff };
 * 
 * var grnInt = ( grn.a << 24 | grn.b << 16 | grn.g << 8 | grn.r );
 * var redInt = ( red.a << 24 | grn.b << 16 | grn.g << 8 | grn.r );
 * 
 * // Map green to blue
 * myLayer.lookupTable = {
 *     grnInt: redInt
 * };
 * (end code)
 */
OpenLayers.Tile.Canvas = OpenLayers.Class(OpenLayers.Tile.Image, {
	
	/*
	 * Element that contains the canvas to draw the tile. Initially set to 
	 * null and created after the tile has been loaded. Set back to null
	 * when clear() is invoked.
	 */
	canvas: null,

	initialize: function(layer, position, bounds, url, size, options) {
		OpenLayers.Tile.Image.prototype.initialize.apply(this, arguments);
	},
	
	/*
     * Discards the canvas.
	 */
	destroy: function() {
		OpenLayers.Tile.Image.prototype.destroy.apply(this, arguments);	
		if ( this.canvas ) {
			this.canvas = null;
		}
	},
		
	/*
	 * Hides the canvas element and clears the image load error class if
	 * set.
	 */
	clear: function() {
		OpenLayers.Tile.Image.prototype.clear(this, arguments);
		if ( this.canvas ) {
			this.canvas.style.visibility = "hidden";
			OpenLayers.Element.removeClass(this.canvas, "olImageLoadError");
		}
	},
		
	/*
	 * Returns the canvas element by creating one if necessary. Copy over the
	 * style elements that OpenLayers.Tile.Image object applies to the image 
	 * element to the canvas element.
	 */
	getCanvas: function() {
		var image = this.getImage();
		var style;
		
		if ( !this.canvas ) {
			this.canvas = document.createElement("canvas");
			this.canvas.id = "OpenLayers.Tile.Canvas." + this.id;
			this.canvas.className = "olTileImage";
			
			style = this.canvas.style;
			if ( this.frame ) {
				style.left = image.style.left;
				style.top = image.style.top;
				style.width = image.style.width;
				style.height = image.style.height;
			}
			style.visibility = image.style.visibility;
			style.opacity = image.style.opacity;
			style.filter = image.style.filter;
			style.position = image.style.position;
			if ( this.frame ) {
				this.frame.appendChild(this.canvas);
			}
		}
		return this.canvas;
	},
	
	/*
	 * Returns the element that contains the canvas.
	 */
	getTile: function() {
		var canvas = this.getCanvas();
		return this.frame ? this.frame : canvas;
	},

	/*
	 * Draws the loaded image to the canvas and applies a lookup table if
	 */
	onImageLoad: function() { 		 		
	    var graphics = this.canvas.getContext("2d");
        
        OpenLayers.Event.stopObservingElement(this.imgDiv);
		
		this.canvas.width = this.imgDiv.width;
		this.canvas.height = this.imgDiv.height;
		
		graphics.drawImage(this.imgDiv, 0, 0);
		
		if ( this.layer.lookupTable ) {
			var lookupTable = this.layer.lookupTable;
			var imageData = graphics.getImageData(0, 0, this.canvas.width, 
				this.canvas.height);
			var pixels = imageData.data;
				
			for ( var i = 0; i < pixels.length; i += 4 ) {
                var lookup = 
                    (pixels[0] << 24) |
                    (pixels[1] << 16) |
                    (pixels[2] << 8)  |
                    pixels[3];
                    
				var color = lookupTable[lookup];
				if ( color ) {
					pixels[0] = color >> 24 & 0xff;
					pixels[1] = color >> 16 & 0xff;
					pixels[2] = color >> 8 & 0xff;
					pixels[3] = color & 0xff;
				}
			}
		}
		
		this.canvas.style.visibility = "inherit";
		this.canvas.style.opacity = this.layer.opacity;
		
		this.isLoading = false;
		this.canvasContext = null;
		this.events.triggerEvent("loadend");
	},
	
	/*
	 * FIXME
	 */
	onImageError: function() {
			
	},
	
	/*
	 * Name of this class per OpenLayers convention.
	 */
	CLASS_NAME: "OpenLayers.Tile.Canvas"
	
});
