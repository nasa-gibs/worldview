/**
 * Namespace: Worldview
 */
(function(ns) { 

    ns.namespace = function() {
        var obj;
        for ( var i = 0; i < arguments.length; i++ ) {
            var list=(""+arguments[i]).split(".");
            obj = Worldview;
            for ( var j = 0; j < list.length; j++ ) {
                obj[list[j]] = obj[list[j]] || {};
                obj = obj[list[j]];
            }
        } 
        return obj;
    }
           
})(window.Worldview = window.Worldview || {});

