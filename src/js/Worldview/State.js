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
 * State of the application.
 * 
 * This is an object representation of all key/value pairs in the query string.
 * To object an instance of this class:
 * 
 *      var state = REGISTRY.getState();
 * 
 * This object is a copy of the state when the getState method was invoked.
 * Always call getState to get the latest information. Instances of this
 * class are not updated as state changes. 
 * 
 * @class State
 */

/**
 * Array of active base layers.
 * @attribute baseLayers {Array(string)}
 */

/**
 * All components that have been registered, keyed by the component identifier
 * (name used in the query string)
 * @attribute components {Object} 
 */

/**
 * EPSG projection code for the current display. for arctic, this could be
 * 3995 or 3413 depending on the day.
 * 
 * @attribute epsg {string} 
 */

/**
 * Products that are in the active layers list but are hiddent from view.
 * @attribute hiddenProducts {Array(string)}
 */

/**
 * TODO 
 * @attribute opacity
 */

/**
 * TODO
 * @attribute opacityString
 */

/**
 * TODO
 * @attribute palettes
 */

/**
 * TODO
 * @attribute palettesString
 */

/**
 * All products in the active layers list (base layers and overlays)
 * 
 * @attribute products {Array(String)}
 */

/**
 * Value of the query string segment for the product list. In the form of:
 * 
 *     baselayers,LAYER,LAYER~overlays,LAYER,LAYER
 * 
 * where LAYER is a layer name. Hidden layers are prefixed with an exclamation
 * point (!).
 * 
 * @attribute productsString
 */

/**
 * Current map projection. Either "geographic", "arctic", or "antarctic"
 * 
 * @attribute projection {string}
 */

/**
 * Current day being viewed. Hours, minutes, and seconds will always be
 * UTC zero.
 * 
 * @attribute time {Date}
 */