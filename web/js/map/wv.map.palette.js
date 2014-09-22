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
wv.map = wv.map || {};
wv.map.palette = wv.map.palette || {};

wv.map.palette.canvasTile = OpenLayers.Class(OpenLayers.Tile.Image, {

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

        this.latestJobId = wv.map.tileScheduler().submit({
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
    CLASS_NAME: "wv.map.palette.canvasTile"

});


wv.map.palette.scheduler = function(config) {

    var self = {};

    // Array of web workers equal to the size of maxWorkers
    var workers = [];

    // For each worker, contains the job identifier that is currently being
    // executed
    var jobExecuting = [];

    // Jobs which cannot be submitted immedately are placed in this queyue.
    var queue = [];

    // Each job is assigned an ID. This holds the next available number.
    var nextId = 1;

    // Information about jobs being tracked is place here keyed by jobId.
    // Includes:
    // jobId: job identifier
    // callback: callback to be invoked after work has completed.
    // creationTime: time in ms that the job was submitted.
    // queuedTime: time in ms that the job entered the queue.
    // postedTime: time in ms that the job was posted to the worker for
    //             execution.
    var jobs = {};

    // Number of jobs that are currently being executed
    var executing = 0;

    // Number of workers to start
    var maxWorkers = config.max || 1;

    //-------------------------------------------------------------------------
    // Public
    //-------------------------------------------------------------------------

    var init = function() {
        var factory = config.factory || function() {
            return new Worker(config.script);
        };
        var max = config.max || 1;

        for ( var i = 0; i < max; i++ ) {
            var worker = factory(config.script);
            worker.addEventListener("message", onSuccess, false);
            worker.addEventListener("error", onError, false);
            workers[i] = worker;
            // Attach the index of the worker itself to the worker. This is
            // useful for identifying the correct worker on an error event.
            workers[i].id = i;
        }
    };

    /**
     * Property: profile
     * If true, statistics are collected in the <stats> property.
     */
    self.profile = false;

    /**
     * Property: stats
     * If <profile> is set to true, <Stats> will be collected in this object.
     */
    self.stats = {
        queued: 0,
        executed: 0,
        averageTime: 0.0,
        maximumTime: 0,
        averageQueueTime: 0.0,
        maximumQueueTime: 0.0,
        averageExecutionTime: 0.0,
        maximumExecutionTime: 0.0,
    };

    /**
     * Function: submit
     *
     * Submit a job to be executed when a worker becomes available.
     *
     * Parameters:
     * spec.message  - Data sent to the worker.
     * spec.callback - Callback to be executed when the job completes. The
     *                 callback should accept one argument, a <Results>
     *                 object.
     * spec.self     - If needed, the this object to be returned in the
     *                 callback.
     *
     * Returns:
     * The numeric identifier assigned to this job.
     *
     * Throws:
     * An exception if spec.callback is not a function.
     */
    self.submit = function(spec) {
        if ( typeof spec.callback !== "function" ) {
            throw new Error("spec.callback is not defined or is not a " +
                    "function");
        }

        var id = nextId++;
        var job = {
            id: id,
            message: spec.message || null,
            callback: spec.callback,
            self: spec.self || null
        };

        if ( self.profile ) {
            job.creationTime = new Date();
        }
        jobs[id] = job;

        if ( executing < maxWorkers ) {
            execute(job);
        } else {
            enqueue(job);
        }
        return id;
    };

    /**
     * Function: cancel
     * Clears all jobs from the queue and messages all active works to stop.
     */
    self.cancel = function() {
        queue = [];
        $.each(worker, function(jobId, workers) {
            worker.postMessage({command: "cancel"});
        });
    };

    //-------------------------------------------------------------------------
    // Private
    //-------------------------------------------------------------------------

    /*
     * Called when the worker completes a job.
     */
    var onSuccess = function(event) {
        var results = event.data;
        notify(event, jobs[results.id]);
    };

    /*
     * Called when the worker fails due to a thrown exception.
     */
    var onError = function(event) {
        // Grab the worker id that was stuffed into the worker object and
        // use that to lookup the job id
        workerId = event.target.id;
        jobId = jobExecuting[workerId];

        results = {
            id: jobId,
            status: "error",
        };
        event.data = results;
        notify(event, jobs[results.id]);
    };

    /*
     * Notifies via callback that work has completed, collects statistics
     * if needed, and processes the next item in the queue.
     */
    var notify = function(event, job, callback) {
        executing--;
        if ( self.profile ) {
            collectStatistics(job);
        }
        job.callback({
            id: job.id,
            message: event.data.message,
            status: event.data.status,
            self: job.self
        });
        delete jobs[job.id];
        var workerId = event.target.id;
        delete jobExecuting[workerId];

        processQueue();
    };

    /*
     * Executes the given job in the next available web worker.
     */
    var execute = function(job) {
        var workerId = executing++;
        if ( self.profile ) {
            job.postedTime = new Date();
        }
        var post = {
            command: "execute",
            id: job.id,
            message: job.message,
        };
        jobExecuting[workerId] = job.id;
        workers[workerId].postMessage(post);
    };

    /*
     * Places a job in the queue
     */
    var enqueue = function(job) {
        var queueLength = queue.length + 1;
        if ( self.profile ) {
            self.stats.queued++;
            job.queuedTime = new Date().getTime();
        }
        // Switch to FIFO so that the most recent tiles are always rendered
        // first
        queue.push(job);
        //queue.shift(job);
    };

    /*
     * If the queue is not empty, dequeues the next job and executes.
     */
    var processQueue = function() {
        if ( queue.length > 0 && executing < maxWorkers ) {
            // Switch to FIFO so that the most recent tiles are always rendered
            // first
            //var job = queue.shift();
            var job = queue.pop();
            execute(job);
        }
    };

    /*
     * Collect statistics after a job has been executed
     */
    var collectStatistics = function(job) {
        var stats = self.stats;
        var endTime = new Date();
        var totalTime = endTime - job.creationTime;
        var executionTime = endTime - job.postedTime;

        stats.executed++;
        var previousRatio = (stats.executed - 1) / stats.executed;
        var thisRatio = 1 / stats.executed;

        stats.averageTime =
            (stats.averageTime * previousRatio) + (totalTime * thisRatio);
        stats.maximumTime =
            Math.max(totalTime, stats.maximumTime);
        stats.averageExecutionTime =
            (stats.averageExecutionTime * previousRatio) +
            (executionTime * thisRatio);
        stats.maximumExecutionTime =
            Math.max(executionTime, stats.maximumExecutionTime);

        var queueTime = 0;
        if ( job.queuedTime ) {
            queueTime = job.postedTime - job.queuedTime;
            previousRatio = (stats.queued - 1) / stats.queued;
            thisRatio = 1 / stats.queued;

            stats.averageQueueTime =
                (stats.averageQueueTime * previousRatio) +
                (queueTime * thisRatio);
            stats.maximumQueueTime =
                Math.max(stats.maximumQueueTime, queueTime);
        }
    };

    init();
    return self;

};

/**
 * Stats
 * Contains statistics gathered from the <Scheduler> when <Scheduler.profile>
 * is set to true.
 *
 * Property: queued
 * Total number of jobs that could not be serviced immedately and were placed
 * in the queue.
 *
 * Property: executed
 * Total number of jobs that have been executed.
 *
 * Property: averageTime
 * Average time, in milliseconds, taken to complete requests.
 *
 * Property: maxmimumTime
 * Maximum time, in milliseconds, taken to complete requests.
 *
 * Property: averageQueueTime
 * Average time, in milliseconds, that jobs waited in the queue before being
 * executed.
 *
 * Property: maximumQueueTime
 * Maximum time, in milliseconds, that a job waited in the queue before being
 * executed.
 *
 * Property: averageExecutionTime
 * Average time, in milliseconds, that jobs took to execute in the web worker.
 *
 * Property: maximumExecutionTime
 * Maximum time, in milliseconds, that a job took to execute in the web worker.
 */

/**
 * Results
 * Object that contains information on a completed job.
 *
 * Property: id
 * The numeric identifier assigned to this job
 *
 * Property: message
 * The data content returned by the worker.
 *
 * Property: status
 * Either "success", "error", or "cancel"
 *
 * Property: self
 * If provided, the "this" context of the caller.
 */
