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

Worldview.namespace("Map");

/**
 * Class: Worldview.Map.CanvasTile
 *
 * Cavas based tile generator. The default tile generator,
 * OpenLayers.Tile.Image renders each tile in an image element. This generator
 * is simiar except that it uses canvas elements instead. This can be used in a
 * layer by providing an instance at instantiation:
 *
 * (start code)
 * var myLayer = new OpenLayers.Layer.WMTS({
 *     name: "My Layer",
 *     tileClass: Worldview.Map.CanvasTile,
 *     ...
 * });
 * (end code)
 *
 * To apply a lookup table to dynamically change the colors of the tile,
 * set a lookupTable property in OpenLayers.Layer with a <ColorLookup> object.
 * Example:
 *
 * (start code)
 * var red = { r: 255, g: 0x00, b: 0x00, a: 255 };
 *
 * // Map green to blue
 * myLayer.lookupTable = {
 *     "0,255,0,255": redInt
 * };
 * (end code)
 */
Worldview.Map.CanvasTile = OpenLayers.Class(OpenLayers.Tile.Image, {

    // Element that contains the canvas to draw the tile. Initially set to
    // null and created after the tile has been loaded. Set back to null
    // when clear() is invoked.
	canvas: null,

	// Canvas that contains the pixels of the original tile. This allows
	// lookups to be applied multiple times without reloading the layer.
	canvasOriginal: null,

	// Graphics context for the canvas
    graphics: null,

    // Graphics context for the canvas containing the original image
    graphicsOriginal: null,

    // The ID of the last job submitted to the scheduler. If a response
    // comes back that is not this ID, the tile is stale and can be thrown
    // out
    latestJobId: null,

	initialize: function(layer, position, bounds, url, size, options) {
	    // This is required or the browser will throw security exceptions
        this.crossOriginKeyword = "anonymous";
		OpenLayers.Tile.Image.prototype.initialize.apply(this, arguments);
	},

	/*
     * Discards the canvas.
	 */
	destroy: function() {
		OpenLayers.Tile.Image.prototype.destroy.apply(this, arguments);
		this.clear();
		if ( this.canvas ) {
		    this.graphics = null;
			this.canvas = null;
			this.graphicsOriginal = null;
			this.canvasOriginal = null;
		}
	},

	/*
	 * Hides the canvas element and clears the image load error class if
	 * set.
	 */
	clear: function() {
		OpenLayers.Tile.Image.prototype.clear.apply(this, arguments);
		if ( this.canvas ) {
			this.canvas.style.visibility = "hidden";
			this.canvas.style.opacity = 0;
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
			this.graphics = this.canvas.getContext("2d");
			this.canvas.id = "OpenLayers.Tile.Canvas." + this.id;
			this.canvas.className = "olTileImage";

			style = this.canvas.style;
			if ( this.frame ) {
				style.left = image.style.left;
				style.top = image.style.top;
				style.width = image.style.width;
				style.height = image.style.height;
			}
			style.visibility = "hidden";
			style.opacity = 0;
			style.filter = image.style.filter;
			style.position = image.style.position;
			if ( this.frame ) {
				this.frame.appendChild(self.canvas);
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
     * Relods a tile from the server.
     */
    setImgSrc: function() {
        // If the tile is being reloaded, hide the canvas so that stale
        // tiles are not visible
        if ( this.canvas ) {
            this.canvas.visibility = "hidden";
            this.canvas.opacity = 0;
            this.latestJobId = 0;
        }
        if ( this.imgDiv ) {
            OpenLayers.Tile.Image.prototype.setImgSrc.apply(this, arguments);
        }
    },

    /*
     * Takes the loaded image and submits it to the scheduler to render the
     * color lookup table.
     */
    onImageLoad: function() {
        OpenLayers.Event.stopObservingElement(this.imgDiv);

        // Draw the image that was loaded and save it for anytime a color
        // lookup needs to be applied
        this.canvasOriginal = document.createElement("canvas");
        this.graphicsOriginal = this.canvasOriginal.getContext("2d");
        this.canvasOriginal.width = this.imgDiv.width;
        this.canvasOriginal.height = this.imgDiv.height;
        this.graphicsOriginal.drawImage(this.imgDiv, 0, 0);

        // Ensure the canvas object has been created
        var canvas = this.getCanvas();
        canvas.width = this.canvasOriginal.width;
        canvas.height = this.canvasOriginal.height;

        this.scheduleTile();
    },

    /**
     * Function: applyLookup
     * Changes the lookup table for the tile and repaints the canvas.
     */
    applyLookup: function() {
        if ( !this.canvas ) {
            return;
        }
        this.isLoading = true;
        this.events.triggerEvent("loadstart");
        this.scheduleTile();
    },

    /*
     * Submit the render operation to the scheduler.
     */
    scheduleTile: function() {
        var lookupTable = this.layer.lookupTable;
        if ( this.graphicsOriginal === null ) {
            return;
        }
        var source = this.graphicsOriginal.getImageData(0, 0, this.canvas.width,
                this.canvas.height);
        var destination = this.graphics.getImageData(0, 0, this.canvas.width,
                this.canvas.height);

        this.latestJobId = Worldview.Map.TILE_SCHEDULER.submit({
            message: {
                lookupTable: lookupTable,
                source: source,
                destination: destination
            },
            callback: this.onTileRendered,
            self: this
        });
    },

    /*
     * Callback for when the tile has finished rendering.
     */
    onTileRendered: function(results) {
        var self = results.self;
        var canvas = self.canvas;

        // If there is no longer a canvas (a zoom operation cleared it out
        // for use in the back buffer) or this render is not the last tile
        // submitted, this data is now stale and can be thrown away.
        if ( !canvas || results.id !== self.latestJobId ) {
            // Nothing
        // If the operation was cancelled during execution, ignore the result.
        } else if ( results.status === "cancelled" ) {
            // Nothing
        // If there was an error during processing, report it here
        } else if ( results.status === "error" ) {
            // Nothing
        // Draw the tile
        } else if ( results.status === "success" ){
            var imageData = results.message.destination;
            self.graphics.putImageData(imageData, 0, 0);
            canvas.style.visibility = "inherit";
            canvas.style.opacity = self.layer.opacity;
            self.canvasContext = null;
        } else {
            throw new Error("Invalid status during tile rendering: " +
                    results.status);
        }
        self.isLoading = false;
        self.events.triggerEvent("loadend");
    },

	/*
	 * This is called during a zoom for the resize transition effect. It
	 * steals away the canvas object for use in the scaled image shown before
	 * tiles are loaded.
	 */
    createBackBuffer: function() {
        if ( !this.canvas || this.isLoading ) {
            return;
        }
        var backBuffer = this.canvas;
        this.canvas = null;
        return backBuffer;
    },

	/*
	 * Name of this class per OpenLayers convention.
	 */
	CLASS_NAME: "Worldview.Map.CanvasTile"

});

