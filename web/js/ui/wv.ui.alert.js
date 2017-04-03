/*                                                                                                                                      
 * NASA Worldview                                                                                                                       
 *                                                                                                                                      
 * This code was originally developed at NASA/Goddard Space Flight Center for                                                           
 * the Earth Science Data and Information System (ESDIS) project.                                                                       
 *                                                                                                                                      
 * Copyright (C) 2013 - 2017 United States Government as represented by the                                                             
 * Administrator of the National Aeronautics and Space Administration.                                                                  
 * All Rights Reserved.                                                                                                                 
 *
 * Licensed under the NASA Open Source Agreement, Version 1.3                                                                           
 * http://opensource.gsfc.nasa.gov/nosa.php                                                                                             
 */                                                                                                                                     
var wv = wv || {};                                                                                                                      
wv.ui = wv.ui || {};                                                                                                                    
    
/*  
 * @Class
 */ 
wv.ui.alert = wv.ui.alert || function(models, url) {                                                                                 
    var self = {};
    var alertReactFactory = React.createFactory(WVC.Alert);
    var mountCase;                                                                                                              
    var init = function() {
    	var notifications, reactComponent, options, p;
    	mountCase = document.getElementById('wv-alert');
        p = wv.util.get(url);
        p.then(function(response) {
        	var obj = JSON.parse(response);
        	notifications = obj.notifications;
        	// Loop through notifications and create react Alert components
        	for(var i = 0, len = notifications.length; i < len; i++) {
        		var mountDiv = createAlertDiv(mountCase, 'wv-alert-case', i);
        		options = initReactComponent(notifications[i]);
        		reactComponent = renderReactComponent(options, mountDiv);
        	}
        }, function(error) {
        	console.warn(error);
        });
    };  
    var initReactComponent = function(response) {
		return {
			header: response.notification_type,
			content: response.message,
			onclose: closeAlert
		};
    };
    var createAlertDiv = function(parent, id, index) {
    	var div = document.createElement('div');
    	div.id = id + '_' + index;
    	div.className = id;
    	parent.appendChild(div);
    	return div;
    };
    var renderReactComponent = function(options, mountLocation) {
    	console.log(options, mountLocation);
		return ReactDOM.render(alertReactFactory(options), mountLocation);
    };
    var closeAlert = function(e) {
    	console.log(e);
    };

    init();
    return self;
};