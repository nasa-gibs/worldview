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
wv.notifications = wv.notifications || {};                                                                                                                    
    
/*  
 * @Class
 */ 
wv.notifications.ui = wv.notifications.ui || function(models, url) {                                                                                 
    var self = {};
    var mountCase;
    var mainNotification;
    var updateAlert;
    var mainIcon;
    var secondaryNotification;
    var message;
    var sortedNotifications;

    var activeNotifications = [];
    var activeMessage;

    self.events = wv.util.events();
    self.infoIconActive = false;
    self.notifyIconActive = false;
    self.messageIconActive = false;

    var classes = {
        alert: 'fa-bolt',
        message: 'fa-gift',
        outage: 'fa-exclamation-circle'
    };
    var init = function() {
        var reactComponent, options, p, alertUser;
        mainIcon = $('#wv-info-button i')[0];
        console.log(url)
        p = wv.util.get(url);
        p.then(function(response) {
            var obj, notifications, alert;
            obj = JSON.parse(response);

            notifications = obj.notifications;
            sortedNotifications = separateByType(notifications);
            setGlobals(sortedNotifications);


            // Loop through notifications and create react Alert components
            // for(var i = 0, len = notifications.length, item; i < len; i++) {
         //        item = notifications[i];
            //  alertUser = objectAlreadySeen(item);
         //        if(alertUser) {
         //            alert = true;
         //        }
         //        setNotifications(item);
            // }
        }, function(error) {
            console.warn(error);
        });
    };
    var setGlobals = function(sortedNotifications){
        var message, outage, alert;
        message = sortedNotifications.messages[0];
        outage = sortedNotifications.outage[0];
        alert = sortedNotifications.alert[0];

        if(!objectAlreadySeen(message)) {
            mainNotification = 'message'
            activeMessage = message.id;
        } else if(!objectAlreadySeen(alert)) {
            mainNotification = 'alert';
            activeNotifications.push(alert.id);
        } else if(!objectAlreadySeen(outage)) {
            mainNotification = 'outage';
            activeNotifications.push(outage.id);
        }

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
    var handleAlertsAndOutages = function(arra) {

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
    var separateByType = function(obj) {
        var messages = [], alerts = [], outages = [], type, subObj;
        for(var i = 0, len = obj.length; i < len; i++) {
            subObj = obj[i];
            type = subObj.notification_type;

            if(type === 'message') {
                messages.push(subObj);
            } else if(type === 'alert') {
                alerts.push(subObj);
            } else {
                outages.push(subObj);
            }
        }
        return {
            messages: orderByDate(messages),
            alerts: orderByDate(alerts),
            outages: orderByDate(outages)
        };
    };
    var orderByDate = function(obj) {
        obj.sort(function(a, b) {
            return a.created_at - b.created_at;
        });
        return obj;
    };
    var initViewAdjusts = function() {
        updateMainIcon();
    };
    var updateMainIcon = function() {
        mainIcon.class = 'fa fa-2x ' + classes[mainNotification];
    };
    self.getMessage = function() {
        if(classes[mainNotification]) {
            return $("<li><a><i class='ui-icon fa fa-fw " + classes[mainNotification] + "'></i>Notifications</a></li>");
        } else  {
            return null;
        }
    };
    self.getMessage = function() {
        var 
    };
    self.getAlert = function() {
        var $notifyMenuItem;
        if(classes[mainNotification]) {
            $notifyMenuItem = $("<li><a><i class='ui-icon fa fa-fw active" + classes[mainNotification] + "'></i>Notifications</a></li>");
            self.infoIconActive = true;
            self.notifyIconActive = true;

            $notifyMenuItem.on('click', deactivateNotify);
            return $notifyMenuItem;
        } else {
            $notifyMenuItem = $("<li><a><i class='ui-icon fa fa-fw fa-bolt'></i>Notifications</a></li>");
            return $notifyMenuItem;
        }
    };
    var deactivateNotify = function(e) {
        this.className = 'ui-icon fa fa-fw fa-bolt';
        self.infoIconActive = true;
        self.notifyIconActive = true;
        if(self.messageIconActive) {
            mainNotification = alert;
        }
        updateMainIcon();
    };


    init();
    return self;
};