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
    var mainNotification;
    var mainIcon;
    var iconCase;
    var secondaryNotification;
    var sortedNotifications;

    var activeNotifications = {};
    var activeMessageId;

    self.events = wv.util.events();
    self.infoIconActive = false;
    self.notifyIconActive = false;
    self.messageIconActive = false;

    var classes = {
        alert: 'bolt',
        message: 'gift',
        outage: 'exclamation-circle'
    };
    var init = function() {
        var reactComponent, options, p, alertUser;
        mainIcon = $('#wv-info-button i')[0];
        iconCase = $('#wv-info-button')[0];
        p = wv.util.get(url);
        p.then(function(response) {
            var obj, notifications, alert;
            obj = JSON.parse(response);

            notifications = obj.notifications;
            sortedNotifications = separateByType(notifications);
            setGlobals(sortedNotifications);
            updateMainIcon();
        }, function(error) {
            console.warn(error);
        });
    };
    var setGlobals = function(sortedNotifications){
        var message, outage, alert;
        message = sortedNotifications.messages[0];
        outage = sortedNotifications.outages[0];
        alert = sortedNotifications.alerts[0];

        if(!objectAlreadySeen(message)) {
            mainNotification = 'message';
            activeMessageId = message.id;
        } 
        if(!objectAlreadySeen(alert)) {
            mainNotification = 'alert';
            activeNotifications.alert = alert.id;
        }
        if(!objectAlreadySeen(outage)) {
            mainNotification = 'outage';
            activeNotifications.outage = outage.id;
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
        if(mainNotification) {
            mainIcon.className = 'fa fa-2x fa-' + classes[mainNotification];
            iconCase.className = 'wv-toolbar-button ' + classes[mainNotification];
        } else {
            mainIcon.className = 'fa fa-2x fa-info-circle';
            iconCase.className = 'wv-toolbar-button';
        }
    };
    self.getMessages = function() {
        var $message;
        if(activeMessageId) {
            $message = $("<li class='gift'><a><i class='ui-icon fa fa-fw fa-gift active'></i>What's new</a></li>");
            $message.on('click', deactivateMessage);
            self.messageIconActive = true;
            return $message;
        } else  {
            return $("<li><a><i class='ui-icon fa fa-fw fa-gift'></i>What's New</a></li>");
        }
    };

    self.getAlert = function() {
        var $notifyMenuItem;
        if(!_.isEmpty(activeNotifications)) {
            $notifyMenuItem = $("<li class='" + classes[mainNotification] + "'><a><i class='ui-icon fa fa-fw active fa-" + classes[mainNotification] + "'></i>Notifications</a></li>");
            self.infoIconActive = true;
            self.notifyIconActive = true;

            $notifyMenuItem.on('click', notify);
            return $notifyMenuItem;
        } else {
            $notifyMenuItem = $("<li><a><i class='ui-icon fa fa-fw fa-bolt'></i>Notifications</a></li>");
            $notifyMenuItem.on('click', notify);
            return $notifyMenuItem;
        }
    };
    var deactivateMessage = function(e) {
        this.className = 'ui-icon fa fa-fw fa-gift';
        self.messageIconActive = false;
        wv.util.localStorage('message', activeMessageId);
        activeMessageId = null;
        if(mainNotification === 'message') {
            mainNotification = null;
        }
        updateMainIcon();
    };
    var notify = function(e) {
        this.className = 'ui-icon fa fa-fw fa-bolt';
        self.infoIconActive = false;
        self.notifyIconActive = false;
        mainNotification = null;
        createNotifyDialog();
        if(activeNotifications.outage) {
            wv.util.localStorage('outage', activeNotifications.outage);
        }
        if(activeNotifications.alert) {
             wv.util.localStorage('alert', activeNotifications.alert);
        }
        activeNotifications = {};
        if(self.messageIconActive) {
            mainNotification = 'message';
        }
        updateMainIcon();
    };
    var createNotifyDialog = function() {
        var $dialog;
        var $notifyContent = $('<div class="wv-notify-modal"></div>');

        $notifyContent.append(create$block(sortedNotifications.outages, 'Outage'));
        $notifyContent.append(create$block(sortedNotifications.alerts, 'Alert'));
        $dialog = wv.ui.getDialog().append($notifyContent);
        $dialog.dialog({
            title: "Notifications",
            width: 625,
            height: 525,
            show: { effect: "fade" },
            hide: { effect: "fade" }
        });
    };
    var create$block = function(arra, title) {
        var $li, $ul = $('<ul></ul>');

        for(var i = 0, len = arra.length; i < len; i++) {
            $li = $("<li><div><h2>" + title + "</h2><p>" + arra[i].message +"</p></div></li>");
            $ul.append($li);
        }
        return $ul;
    };


    init();
    return self;
};