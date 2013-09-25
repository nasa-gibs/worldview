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
Worldview.namespace("DataDownload");

Worldview.DataDownload.WgetPage = (function() {
    
    var ns = {};
    
    ns.show = function(selection) {
        var storage = {};
        $.each(selection, function(name, product) {
            storage[name] = {
                list: product.list,
                name: product.name,
                noBulkDownload: product.noBulkDownload || false
            };    
        });
        localStorage.wget = JSON.stringify(storage);
        var text = window.open('pages/wget.html', 'Worldview_' + new Date());
    };
        
    return ns;
    
})();
