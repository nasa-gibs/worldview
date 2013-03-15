
Worldview.Scheduler = function(workerScript, maxJobs) {
    
    var log = Logging.Logger("Worldview.Scheduler");
    var self = {};
    var workers = [];
    var queue = [];
    var nextId = 1;
    var jobs = {};
    var executing = 0;
    var maxJobs = maxJobs || 1;
    var supportsTransferables = true;
    
    var init = function() {
        //Logging.debug("Worldview.Scheduler");
        for ( var i = 0; i < maxJobs; i++ ) {
            var worker = new Worker(workerScript);   
            worker.addEventListener("message", onWorkComplete, false); 
            worker.addEventListener("error", onError, false);           
            workers[i] = worker; 
        }
    };
    
    var endOfWorkStatistics = function(job) {
        var stats = self.stats;
        var endTime = new Date().getTime();
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
    }
    
    var onWorkComplete = function(event) {
        executing--;
        var results = event.data;
        var timingInfo = "";
        var job = jobs[results.id];
        
        if ( self.profile ) {
            endOfWorkStatistics(job);
        }
        log.debug("Completed job " + job.id + ", backlog: " + queue.length);
        jobs[results.id].callback({
            message: results.message,
            self: jobs[results.id].self
        });
        delete jobs[results.id];
        
        if ( queue.length > 0 && executing < maxJobs ) {
            var job = queue.shift();
            execute(job);
        } 
    };
    
    var onError = function(event) {
        log.error(event);
    };
    
    var execute = function(job) {
        var workerId = executing++;
        log.debug("Executing job " + job.id + ", worker " + workerId + 
                ", backlog: " + queue.length);
        
        /*
        workers[workerId].postMessage({
            id: job.id, 
            message: job.message
        }, job.transferables);    
        */
        if ( self.profile ) {
            job.postedTime = new Date().getTime();
        }
        var post = {
            id: job.id,
            message: job.message,
            supportsTransferables: supportsTransferables
        }
        if ( supportsTransferables ) {
            try {
                workers[workerId].postMessage(post, job.transferables);
            } catch ( error ) {
                log.warn("Transferables unsupported: " + error);
                supportsTransferables = false;
                post.supportsTransferables = false;
            }
        }
        if ( !supportsTransferables ) {
            workers[workerId].postMessage(post);
        }          
    };
    
    var enqueue = function(job) {
        var queueLength = queue.length + 1;
        log.debug("Queueing job " + job.id + ", backlog: " + queueLength); 
        if ( self.profile ) {
            self.stats.queued++;
            job.queuedTime = new Date().getTime();
        }
        queue.push(job);
    };
    
    self.profile = false;

    self.stats = {
        queued: 0,
        executed: 0,
        averageTime: 0.0,
        maximumTime: 0,
        averageQueueTime: 0.0,
        maximumQueueTime: 0,
        averageExecutionTime: 0.0,
        maximumExecutionTime: 0,
    };
    
    self.submit = function(spec) {
        var id = nextId++;
        var job = {
            id: id,
            message: spec.message,
            callback: spec.callback,
            transferables: spec.transferables,
            self: spec.self
        };
        if ( self.profile ) {
            job.creationTime = new Date().getTime();
        }
        jobs[id] = job;
        
        if ( executing < maxJobs ) {
            execute(job);
        } else {
            enqueue(job);
        }            
    }
    
        
    init();
    return self;
    
};
