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
 * Class: Worldview.Scheduler
 * Executes jobs in web workers and queues requests if busy.
 *
 * Logger:
 * Worldview.Scheduler
 *
 * Constructor: Scheduler
 * Creates a new instance.
 *
 * Parameters:
 * config.script  - The path to the script that contains the code for the
 *                  web worker. This path should be relative to the application
 *                  root.
 * config.max     - Number of workers to start. Requests up to this number can
 *                  run concurrently--after this jobs are queued.
 * config.factory - Use this function to create web workers instead of invoking
 *                  new directly.
 *
 */
Worldview.Scheduler = function(config) {

    var log = Logging.getLogger("Worldview.Scheduler");
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

        log.debug("Executing: " + executing);
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
        if ( log.isDebugEnabled() ) {
            $.each(job, function(index, queue) {
                log.debug("Removed job " + job.id + " from queue");
            });
        }
        queue = [];
        $.each(worker, function(jobId, workers) {
            log.debug("Cancelling job " + jobId);
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
        log.debug("Completed job " + results.id + ", backlog: " +
                queue.length);
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
        log.debug("Error on job " + results.id + ": " + event.message +
                ", " + "backlog: " + queue.length);
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
        log.debug("Executing job " + job.id + ", worker " + workerId +
                ", backlog: " + queue.length);

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
        log.debug("Queueing job " + job.id + ", backlog: " + queueLength);
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
        log.debug("Job " + job.id + ": total " + totalTime + "ms, queue " +
                  queueTime + "ms, execution " + executionTime + "ms");
    };

    init();
    return self;

};

/**
 * Section: Static Functions
 *
 * Function: isSupported
 * Returns true if Worker is defined in the window object.
 */
Worldview.Scheduler.isSupported = function() {
    return window.Worker !== undefined;
};

/**
 * Class: Worldview.Scheduler.Stats
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
 * Class: Worldview.Scheduler.Results
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