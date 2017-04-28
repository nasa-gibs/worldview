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
    var mountCase;
    var mainNotification;
    var updateAlert;
    var mainIcon;
    var secondaryNotification;
    var message;

    var classes = {
        alert: 'fa-bolt',
        message: 'fa-gift',
        outage: 'fa-exclamation-circle'
    };
    var init = function() {
    	var reactComponent, options, p, alertUser;
    	$mainIcon = $('#wv-info-button i')[0];
        p = wv.util.get(url);
        p.then(function(response) {
            var obj, notifications, alert;
        	
            alert = false;
            obj = JSON.parse(response);
        	notifications = obj.notifications;
        	// Loop through notifications and create react Alert components
        	for(var i = 0, len = notifications.length, item; i < len; i++) {
                item = notifications[i];
        		alertUser = objectAlreadySeen(item);
                if(alertUser) {
                    alert = true;
                }
                setNotifications(item);
        	}
        }, function(error) {
        	console.warn(error);
        });
    };
    var objectAlreadySeen = function(obj) {
        var fieldExists, fieldValueMatches, type, idString;

        type = obj.notification_type;
        idString = obj.id.toString();
        fieldExists = wv.util.isInLocalStorage(type);
        fieldValueMatches = false;

        if(fieldExists) {
            fieldValueMatches = wv.util.localStorageValueMatches(type, idString);
        }
        return fieldValueMatches;
    };

    var setNotifications = function(obj) {
        var arraLength, message, alert, outage, type;

        type = obj.notification_type;
        
        if(type === 'message') {
            updateAlert = true;
            if(!mainNotification) {
                mainNotification = 'message';
            }
            
        } else if(type === 'alert') {
            if(mainNotification !== 'outage') {
                mainNotification = 'alert';
            }
        } else {
            mainNotification = 'outage';
        }
    };
    var setSecondaryIcons = function(obj) {
        var type;

        type = obj.notification_type;
        
        if(type === 'message') {
            updateAlert = true;
            if(!mainNotification) {
                mainNotification = 'message';
            }
            
        } else if(type === 'alert') {
            alertUser(obj);
            if(mainNotification !== 'outage') {
                mainNotification = 'alert';
            }
        } else {
            mainNotification = 'outage';
        }
    };
    var initViewAdjusts = function() {
        updateMainIcon();
    };
    var updateMainIcon = function() {
        mainIcon.class = 'fa fa-2x ' + classes[mainNotification];
    };
    self.getAlert = function() {
        if(classes[mainNotification]) {
            return $("<li><a><i class='ui-icon fa fa-fw " + classes[mainNotification] + "'></i>Notifications</a></li>");
        } else  {
            return null;
        }
    };

    init();
    return self;
};