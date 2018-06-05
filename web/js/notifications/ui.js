import $ from 'jquery';
import util from '../util/util';
import lodashIsEmpty from 'lodash/isEmpty';
import wvui from '../ui/ui';
/*
 * @Class
 */
export function notificationsUi(models, config) {
  var self = {};
  var mainNotification;
  var mainIcon;
  var mainIconLabel;
  var sortedNotifications = {};

  var activeNotifications = {};
  var activeMessageId;
  var url;
  var alertBlockExists;
  var messageBlockExists;
  url = config.features.alert.url;
  messageBlockExists = false;
  alertBlockExists = false;
  self.events = util.events();
  self.infoIconActive = false;
  self.notifyIconActive = false;
  self.messageIconActive = false;

  var classes = {
    alert: 'bolt',
    message: 'gift',
    outage: 'exclamation-circle'
  };
  /*
   * Sets global vars, initiates API request
   *  and triggers dom adjustments based on request
   *  results
   *
   * @function init
   * @private
   *
   * @returns {void}
   */
  var init = function () {
    var p;
    if (!util.browser.localStorage) {
      return;
    }
    if (config.parameters.mockAlerts) {
      url = 'mock/notify_' + config.parameters.mockAlerts + '.json';
    }

    mainIcon = $('#wv-info-button')[0];
    mainIconLabel = $('#wv-info-button label')[0];
    p = util.get(url);
    p.then(function (response) {
      var obj, notifications;

      obj = JSON.parse(response);
      notifications = obj.notifications;
      sortedNotifications = separateByType(notifications);
      update(sortedNotifications);
    }, function (error) {
      console.warn(error);
    });
  };
  /*
   * Sets active state global values
   *
   * @function setGlobals
   * @private
   *
   * @param {object} sortedNotifications - object that
   *  contains categorized notifications
   *
   * @returns {void}
   */
  var getPriority = function (sortedNotifications) {
    var priority, message, outage, alert;
    priority = null;
    message = sortedNotifications.messages[0];
    outage = sortedNotifications.outages[0];
    alert = sortedNotifications.alerts[0];
    if (outage || alert) {
      alertBlockExists = true;
    }
    if (message) {
      messageBlockExists = true;
    }
    if (message && !objectAlreadySeen(message)) {
      priority = 'message';
      mainNotification = 'message';
      activeMessageId = message.created_at;
    }
    if (alert && !objectAlreadySeen(alert)) {
      priority = 'alert';
      mainNotification = 'alert';
      activeNotifications.alert = alert.created_at;
    }
    if (outage && !objectAlreadySeen(outage)) {
      priority = 'outage';
      mainNotification = 'outage';
      activeNotifications.outage = outage.created_at;
    }
    return priority;
  };
  var getCounts = function () {
    var outageCount, messageCount, alertsAndOutages;

    messageCount = getNumberOfTypeNotseen('message', sortedNotifications.messages);

    alertsAndOutages = getNumberOfTypeNotseen('alert', sortedNotifications.alerts); // Number of alerts not yet seen
    outageCount = getNumberOfTypeNotseen('outage', sortedNotifications.outages); // Number of outages not yet seen

    alertsAndOutages = alertsAndOutages + outageCount;

    return {
      messageCount: messageCount,
      alertCount: alertsAndOutages
    };
  };
  /**
   * @return {void}
   */
  var update = function () {
    var alertCount, messageCount, counts, priority;
    counts = getCounts();
    alertCount = counts.alertCount;
    messageCount = counts.messageCount;
    priority = getPriority(sortedNotifications);
    updateMainIcon(priority, alertCount + messageCount);
  };

  /*
   * Determines the number of status of this type
   * that the user is yet to see
   *
   * @function getNumberOfTypeNotseen
   * @private
   *
   * @param {string} type - Status type
   * @param {object} arra - array of status of one type
   *
   * @returns {Number} count - number of unseen messages
   *  in LocalStorage
   */
  var getNumberOfTypeNotseen = function (type, arra) {
    var storageItem = localStorage.getItem(type);
    var count, len;

    len = arra.length;
    count = 0;
    if (!storageItem) {
      return len;
    }
    for (var i = 0; i < len; i++) {
      if (new Date(storageItem) < new Date(arra[i].created_at)) {
        count++;
      } else {
        return count;
      }
    }
    return count;
  };

  /*
   * Determines if most recent notification has already
   *  been seen
   *
   * @function objectAlreadySeen
   * @private
   *
   * @param {object} obj - object from API array
   *
   * @returns {void}
   */
  var objectAlreadySeen = function (obj) {
    var fieldExists, fieldValueMatches, type, idString;

    type = obj.notification_type;
    idString = obj.created_at.toString();
    fieldValueMatches = false;
    fieldExists = !!localStorage.getItem(type);
    if (fieldExists) {
      fieldValueMatches = localStorageValueMatches(type, idString);
    }
    return fieldValueMatches;
  };

  /*
   * Categorizes the returned array
   *
   * @function separateByType
   * @private
   *
   * @param {object} obj - array from API
   *
   * @returns {void}
   */
  var separateByType = function (obj) {
    var type;
    var subObj;
    var messages = [];
    var alerts = [];
    var outages = [];

    for (var i = 0, len = obj.length; i < len; i++) {
      subObj = obj[i];
      type = subObj.notification_type;

      if (type === 'message') {
        messages.push(subObj);
      } else if (type === 'alert') {
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

  /*
   * Organizes array by date created
   *
   * @function orderByDate
   * @private
   *
   * @param {object} obj - array
   *
   * @returns {void}
   */
  var orderByDate = function (obj) {
    obj.sort(function (a, b) {
      return new Date(b.created_at) - new Date(a.created_at);
    });
    return obj;
  };

  /*
   * Manipulates the Info Icon's class name
   *
   * @function updateMainIcon
   * @private
   *
   * @returns {void}
   */
  var updateMainIcon = function (type, numberOfAlerts) {
    mainIconLabel.setAttribute('data-content', numberOfAlerts);
    if (type) {
      mainIcon.className = 'wv-toolbar-button wv-status-' + type;
    } else {
      mainIcon.className = 'wv-toolbar-button wv-status-hide';
    }
  };
  /*
   * Creates a message menu item and attaches
   *  event listeners to the element
   *
   * @function getMessages
   * @static
   *
   * @returns {object} a jquery element
   */
  self.getMessages = function () {
    var $message, messageNumber, messages, hide;
    hide = '';
    messages = sortedNotifications.messages;

    if (!messageBlockExists) {
      return null;
    }
    if (activeMessageId) {
      messageNumber = getNumberOfTypeNotseen('message', messages);
      if (messageNumber === 0) {
        hide = 'wv-status-hide'; // hides number value when === zero
      }
      $message = $('<li class=\'gift\'><a class=\'' + hide + '\' data-content=\'' + messageNumber + '\'><i class=\'ui-icon fa fa-fw fa-gift active\'></i>What\'s New</a></li>');
      $message.on('click', deactivateMessage);
      self.messageIconActive = true;
      return $message;
    } else {
      $message = $('<li><a class=\'wv-status-hide\'><i class=\'ui-icon fa fa-fw fa-gift\'></i>What\'s New</a></li>');
      $message.on('click', deactivateMessage);
      return $message;
    }
  };

  /*
   * Creates a notification menu item and attaches
   *  event listeners to the element
   *
   * @function getAlert
   * @static
   *
   * @returns {object} a jquery element
   */
  self.getAlert = function () {
    var $notifyMenuItem, alertsNumber, outageNumber, count, hide;

    if (!lodashIsEmpty(activeNotifications)) {
      alertsNumber = getNumberOfTypeNotseen('alert', sortedNotifications.alerts);
      outageNumber = getNumberOfTypeNotseen('outage', sortedNotifications.outages);
      count = outageNumber + alertsNumber;
      hide = '';
      if (count === 0) {
        hide = 'wv-status-hide'; // hides number value when === zero
      }
      $notifyMenuItem = $('<li class=\'' + classes[mainNotification] + '\'><a class=\'' + hide + '\' data-content=\'' + count + '\'><i class=\'ui-icon fa fa-fw active fa-' + classes[mainNotification] + '\'></i>Notifications</a></li>');
      self.infoIconActive = true;
      self.notifyIconActive = true;

      $notifyMenuItem.on('click', notify);
      return $notifyMenuItem;
    } else if (alertBlockExists) {
      $notifyMenuItem = $('<li><a class=\'wv-status-hide\'><i class=\'ui-icon fa fa-fw fa-bolt\'></i>Notifications</a></li>');
      $notifyMenuItem.on('click', notify);
      return $notifyMenuItem;
    } else {
      return null;
    }
  };

  /*
   * Adds API element to localstorage,
   *  deactives message active state,
   *  and updates the info icon
   *
   * @function deactivateMessage
   * @private
   *
   * @returns {void}
   */
  var deactivateMessage = function (e) {
    var messages;
    this.className = 'ui-icon fa fa-fw fa-gift';
    self.messageIconActive = false;
    if (activeMessageId) {
      localStorage.setItem('message', activeMessageId);
    }
    activeMessageId = null;
    messages = sortedNotifications.messages[0];
    if (messages) {
      create$whatsNew(messages, 'Latest Release');
    }
    if (mainNotification === 'message') {
      mainNotification = null;
    }
    update();
  };

  /*
   * Adds API element to localstorage,
   *  deactives notification active states,
   *  and updates the info icon
   *
   * @function notify
   * @private
   *
   * @returns {void}
   */
  var notify = function (e) {
    this.className = 'ui-icon fa fa-fw fa-bolt';
    self.infoIconActive = false;
    self.notifyIconActive = false;
    mainNotification = null;

    createNotifyDialog();
    if (activeNotifications.outage) {
      localStorage.setItem('outage', activeNotifications.outage);
    }
    if (activeNotifications.alert) {
      localStorage.setItem('alert', activeNotifications.alert);
    }
    activeNotifications = {};
    if (self.messageIconActive) {
      mainNotification = 'message';
    }
    update();
  };

  /*
   * Adds API element to localstorage,
   *  deactives notification active states,
   *  and updates the info icon
   *
   * @function createNotifyDialog
   * @private
   *
   * @returns {void}
   */
  var createNotifyDialog = function () {
    var $dialog, dimensions;
    var $notifyContent = $('<div class="wv-notify-modal"></div>');
    if (!sortedNotifications.alerts && !sortedNotifications.outages) {
      return null;
    }
    dimensions = getModalDimensions();

    $notifyContent.append(create$block(sortedNotifications.outages, 'outage'));
    $notifyContent.append(create$block(sortedNotifications.alerts, 'alert'));
    $dialog = wvui.getDialog()
      .append($notifyContent);

    $dialog.dialog({
      title: 'Notifications',
      width: dimensions[0],
      height: dimensions[1],
      maxHeight: 525,
      show: {
        effect: 'fade'
      },
      hide: {
        effect: 'fade'
      }
    });
  };

  /*
   * Gets proper size for modal
   *
   * @function createNotifyDialog
   * @private
   *
   * @returns {Object} Dimension array
   */
  var getModalDimensions = function () {
    var width, height;

    width = 625;
    height = 'auto';
    if (util.browser.small || util.browser.touchDevice) {
      width = $(window)
        .width();
      height = $(window)
        .height();
    }
    return [width, height];
  };

  /*
   * Creates a Feed of Jquery list items
   *
   * @function create$block
   * @private
   *
   * @param {Object} arra - array of objects
   * @param {string} title - title
   *
   * @returns {Object} Jquery ul element
   */
  var create$block = function (arra, title) {
    var $li;
    var date;
    var numNotSeen;
    var activeClass;
    var $ul = $('<ul></ul>');

    numNotSeen = getNumberOfTypeNotseen(title, sortedNotifications[title + 's']);

    for (var i = 0, len = arra.length; i < len; i++) {
      activeClass = '';
      if (activeNotifications[title] && i < numNotSeen) {
        activeClass = title;
      }
      date = new Date(arra[i].created_at);
      date = date.getDate() + ' ' + util.giveMonth(date) + ' ' + date.getFullYear();
      $li = $('<li><div class=\'' + activeClass + '\'><h2> <i class=\'fa fa-' + classes[title] + '\'/> ' + title + '<span> Posted ' + date + '</span></h2><p>' + arra[i].message + '</p></div></li>');
      $ul.append($li);
    }
    return $ul;
  };
  /*
   * Checks to see if id or smaller #id
   *   is in localstorage
   *
   * @function localStorageValueMatches
   * @private
   *
   * @param {String} property - name of category type
   * @param {string} value - id of notification
   *
   * @returns {Boolean}
   */
  var localStorageValueMatches = function (property, value) {
    var oldValue = localStorage.getItem(property);
    return new Date(value) <= new Date(oldValue);
  };

  /*
   * Creates a Feed containing most recent message
   *
   * @function create$whatsNew
   * @private
   *
   * @param {Object} most recent message API object
   * @param {string} title - title
   *
   * @returns {void}
   */
  var create$whatsNew = function (obj, title) {
    var $dialog, $notifyContent, releasePageUrl, date, dimensions, $footer;

    date = new Date(obj.created_at);
    date = date.getDate() + ' ' + util.giveMonth(date) + ' ' + date.getFullYear();
    releasePageUrl = config.features.alert.releases || 'https://github.com/nasa-gibs/worldview/releases';
    dimensions = getModalDimensions();
    $notifyContent = $('<div class=\'wv-notify-modal\'><div><h2>' + title + '<span> Posted ' + date + '</span></h2><p>' + obj.message + '</p></div></div>');
    $footer = $('<div class="wv-notify-footer"><p> Check out our <a target="_blank" href="' + releasePageUrl + '">release notes</a> for a complete list of new additions.</p></div>');
    $notifyContent.append($footer);
    $dialog = wvui.getDialog()
      .append($notifyContent);
    $dialog.dialog({
      title: 'What\'s New',
      width: dimensions[0],
      height: dimensions[1],
      maxHeight: 525,
      show: {
        effect: 'fade'
      },
      hide: {
        effect: 'fade'
      }
    });
  };

  init();
  return self;
};
