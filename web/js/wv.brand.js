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
 * @module wv
 */
var wv = wv || {};

/**
 * @class wv.brand
 * @static
 */
wv.brand = wv.brand || (function() {

    var self = {};

    /**
     * Official name of this application.
     *
     * @attribute NAME
     * @type String
     * @static
     */
    self.NAME = "@LONG_NAME@";

    /**
     * Release version string. This value is filled in during the build
     * process.
     *
     * @attribute VERSION
     * @type String
     * @static
     */
    self.VERSION = "@BUILD_VERSION@";

    /**
     * Date and time Worldview was built. This value is filled in during the
     * build process.
     *
     * @attribute BUILD_TIMESTAMP
     * @type string
     * @static
     */
    self.BUILD_TIMESTAMP = "@BUILD_TIMESTAMP@";

    /**
     * The value of the timestamp in numeric form that can be used as
     * a URL nonce "invalidate" cache entries. This value is filled in
     * during the build process.
     *
     * @attribute BUILD_NONCE
     * @type String
     * @static
     */
    self.BUILD_NONCE = "@BUILD_NONCE@";

    /**
     * Determines if this is a release build.
     *
     * @method release
     * @static
     * @return true if the build script has populated the VERSION field,
     * otherwise returns false.
     */
    self.release = function() {
        return self.VERSION[0] !== "@";
    };

    self.url = function(base) {
        var joiner = ( _.indexOf(base, "?") < 0 ) ? "?" : "&";
        return base + joiner + "v=" + self.BUILD_NONCE;
    };

    return self;

})();
