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
 * @module Worldview
 */

/**
 * Preloads resources (images, JSON files). This is a light wrapper around
 * the PreloadJS library (http://www.createjs.com/#!/PreloadJS). The object is
 * created with a manifest of resources that need to be preloaded. Invoke 
 * execute to start loading. An optional callback passed into execute will be 
 * invoked once all the resources have been loaded.
 * 
 * Example:
 * 
 *      var preloader = Worldview.Preloader([
 *          "images/foo.png",
 *          {id: "bar", src: "data/bar", type:"json"}
 *      ]);
 *      preloader.execute(function() {
 *          console.log("Ready!");
 *      });
 *
 * @class Preloader
 * @constructor Preloader
 *
 * @param manifest {Array(Object)} Array of items to preload. See 
 * http://www.createjs.com/Docs/PreloadJS/classes/LoadQueue.html for the
 * format of the manifest.     
 */
Worldview.namespace("Preloader");

Worldview.Preloader = function(manifest) {
    
    var self = {};
    var queue = new createjs.LoadQueue();
    var invoked = false;
    
    var notify = function(callback) {
        if ( callback ) {
            callback(queue);
        }
    }
    
    /**
     * Loads resources provided in the mainfest. If this method has already
     * been called, no resources are loaded and the callback, if provided,
     * is invoked immediately.
     * 
     * @method execute
     * @param callback {function} Function that accepts one argument, the
     * createjs.LoadQueue object used to load the resources. This function
     * is called once the load is complete, or if this method has already
     * been invoked, is called immediately.
     */
    self.execute = function(callback) {
        if ( invoked ) {
            notify(callback);
            return;
        }
        invoked = true;
        queue.addEventListener("complete", function() {
            notify(callback);
        })
        queue.loadManifest(manifest);    
    }
    
    return self;
}
