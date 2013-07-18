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
 * Namespace: Worldview.Preloader
 */
Worldview.namespace("Preloader");

Worldview.Preloader.init = function(callback) {
    
    var queue = new createjs.LoadQueue();
    
    var onComplete = function() {
        callback(queue);    
    };
    
    queue.addEventListener("complete", onComplete);
    
    queue.loadManifest([
        { id: "config", src: "data/config", type:"json" },
        "images/logo.png",
        "images/permalink.png",
        "images/geographic.png",
        "images/arctic.png",
        "images/antarctic.png",
        "images/camera.png",
        "images/cameraon.png",
        "images/information.png",
        "images/expandIn.png",
        "images/expandOut.png",
        "images/visible.png",
        "images/invisible.png",
        "images/close-red-x.png",
        "images/collapseDown.png",
        "images/expandUp.png"       
    ]);
};
