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

/**
 * Performs the task of applying a color lookup table from a source tile
 * to a destination tile.
 *
 * This script is meant to be used from within a web worker and should not
 * be concatentated with other JavaScript files.
 *
 * The following commands are accepted in event.data.command
 *
 * - execute: Starts work. Requires an <Execute> object to be passed in as the
 *   message.
 * - cancel: Cancelles any outstanding work as soon as possible. No message
 *           object is required.
 *
 * The execute command requires the following object to be found in
 * event.data.message
 *
 * Property: lookupTable
 * The lookup table to apply
 *
 * Property: source
 * The canvas image data pixels that are used to lookup in the table.
 *
 * Property: destination
 * The taget canvs image data pixels that the new color will be applied ot.
 *
 */

var cancelled = false;

var execute = function(event) {
    var message = event.data.message;
    var lookupTable = message.lookupTable;

    // Get pixel data from the imageData objects
    var source = message.source.data;
    var destination = message.destination.data;

    for ( var i = 0; i < source.length; i += 4 ) {
        var lookup = source[i + 0] + "," +
                     source[i + 1] + "," +
                     source[i + 2] + "," +
                     source[i + 3];
        var color = lookupTable[lookup];
        // Uncomment this to find colors that do not map
        /*
        if ( !color && lookup !== "0,0,0,0" ) {
            throw Error("Not found: " + lookup);
        }
        */
        if ( color ) {
            destination[i + 0] = color.r;
            destination[i + 1] = color.g;
            destination[i + 2] = color.b;
            destination[i + 3] = 0xff;
        }
        if ( cancelled ) {
            break;
        }
    }
    event.data.status = cancelled ? "cancel" : "success";
    self.postMessage(event.data);
};

self.addEventListener("message", function(event) {
    if ( event.data.command === "execute" ) {
        cancelled = false;
        execute(event);
    } else if ( event.data.command === "cancel" ) {
        cancelled = true;
    } else {
        throw new Error("Invalid command: " + event.data.commmand);
    }
}, false);
