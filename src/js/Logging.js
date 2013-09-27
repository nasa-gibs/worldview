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
 * Simple logging utility.
 *
 * Example:
 *
 *      var log = Logging.getLogger()
 *      log.message("This is a message");
 *
 * Debug messages can be turned on or off:
 *
 *      var log = Logger.getLogger()
 *      log.debug("This is not printed");
 *
 *      Logging.debug();
 *      log.debug("This is printed");
 *
 *      Logging.undebug();
 *      log.debug("This is not printed");
 *
 * Assign names to loggers:
 *
 *      var logA = Logger.getLogger("A");
 *      var logB = Logger.getLogger("B");
 *      Logging.debug("B");
 *      logA.debug("This is not printed");
 *      logB.debug("This is printed");
 *
 * There is no hierarchy of loggers as in log4j. Turning on debug logging
 * for a given name only enables loggers that exactly match that name.
 *
 * This delgates to the corresponding console methods if available, otherwise
 * it delgates to console.log. If console is not defined, nothing is
 * printed out.
 *
 * @module Logging
 * @class Logging
 * @static
 */
(function(ns) {

    var loggers = {};
    var debugAll = false;

    /**
     * Gets the logger with the specified name. If a logger with that name
     * does not exist, one is created.
     *
     * @method getLogger
     * @static
     *
     * @param name {String} Name of the logger to get. If not specified, the
     * unnamed loggeris returned.
     *
     * @return {Logger} The Logger for the given name.
     */
    ns.getLogger = function(name) {
        var logger = null;
        name = name || "";
        if ( name in loggers ) {
            logger = loggers[name];
        } else {
            logger = Logger();
            loggers[name] = logger;
        }
        if ( debugAll ) {
            logger.setDebugEnabled(true);
        }
        return logger;
    };

    /**
     * Turns on logging of debug messages.
     *
     * @method debug
     * @static
     *
     * @param name {String} If specified, this enables debug logging for the
     * Logger with the given name. If not specified, this enables debug
     * logging for all Loggers.
     */
    ns.debug = function(name) {
        if ( name ) {
            ns.getLogger(name).setDebugEnabled(true);
        } else {
            $.each(loggers, function(name, logger) {
                logger.setDebugEnabled(true);
            });
            debugAll = true;
        }
    };

    /**
     * Turns off logging of debug messages.
     *
     * @method undebug
     * @static
     *
     * @param name {string} If specified, this disables logging for the Logger
     * with the given name. If not specified, this disables debug logging
     * for all Loggers.
     */
    ns.undebug = function(name) {
        if ( name ) {
            ns.getLogger(name).setDebugEnabled(false);
        } else {
            $.each(loggers, function(name, logger) {
                logger.setDebugEnabled(false);
            });
            debugAll = false;
        }
    };

    /*
     * Clears out all the known loggers, useful for testing.
     */
    ns.reset = function() {
        loggers = {};
    };

    /**
     * Logging methods.
     *
     * @class Logger
     * @for Logging
     */
     var Logger = function() {

        var self = {};
        var debugEnabled = false;

        /**
         * Prints an error message to the console. Uses console.log or does
         * nothing if console does not exist.
         *
         * @method message
         * @for Logger
         *
         * @param [message]* {object} The message to print to the console.
         */
        self.message = ( !window.console || !window.console.log )
                ? function() {} : console.log.bind(console);

        /**
         * Prints an error message to the console. Uses console.error if
         * it exists, otherwise uses console.log. Does nothing if console
         * does not exist.
         *
         * @method error
         * @for Logger
         *
         * @param [message]* {object} The message to print to the console.
         */
        self.error = ( !window.console || !window.console.error )
                ? self.message: console.error.bind(console);

        /**
         * Prints an warning message to the console. Uses console.warn if
         * it exists, otherwise uses console.log. Does nothing if console
         * does not exist.
         *
         * @method warn
         * @for Logger
         *
         * @param [message]* {object} The message to print to the console.
         */
        self.warn = ( !window.console || !window.console.warn )
                ? self.message : console.warn.bind(console);

        /**
         * Prints an information message to the console. Uses console.info if
         * it exists, otherwise uses console.log. Does nothing if console
         * does not exist.
         *
         * @method info
         * @for Logger
         *
         * @param [message]* {object} The message to print to the console.
         */
        self.info = ( !window.console || !window.console.info )
                ? self.message : console.info.bind(console);

        /**
         * Prints a stack trace to the console. If console.trace does not
         * exist, this method does nothing.
         *
         * @method trace
         * @for Logger
         */
        self.trace = ( !window.console || !window.console.trace )
                ? function() {} : console.trace;

        /**
         * Prints a debug message to the console if debugging is enabled.
         * Debugging can be enabled by calling Logging.debug with the name
         * of this logger, by calling Logging.debug with no parameters,
         * or by calling setDebugEnabled on this logger. If the console object
         * does not exist, this method does nothing.
         *
         * @method debug
         * @for Logger
         *
         * @param [message]* {object} The message to print to the console.
         */
        self.debug = function() {};

        /**
         * Enables or disables logging of debug messages.
         *
         * @method setDebugEnabled
         *
         * @param enabled {boolean} If true, enables debug messages.
         */
        self.setDebugEnabled = function(enabled) {
            if ( enabled ) {
                self.debug = self.message;
            } else {
                self.debug = function() {};
            }
            debugEnabled = enabled;
        };

        /**
         * Indicates if logging messages are enabled.
         *
         * @method isDebugEnabled
         *
         * @return {boolean} True if debug messages will be printed to the
         * console, otherwise returns false.
         */
        self.isDebugEnabled = function() {
            return debugEnabled;
        };

        return self;
    };

}(window.Logging = window.Logging || {}));
