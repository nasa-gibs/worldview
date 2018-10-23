import util from '../util/util';
import lodashIsEmpty from 'lodash/isEmpty';
import wvui from '../ui/ui';

export function notificationsUi(models, config) {
  var alertBlockExists, mainNotification, mainIcon, mainIconLabel, url;
  var self = {};
  var classes = {};
  var sortedNotifications = {};
  var activeNotifications = {};

  self.events = util.events();
  self.infoIconActive = false;
  self.notifyIconActive = false;
  self.messageIconActive = false;

  url = config.features.alert.url;
  alertBlockExists = false;
  classes = {
    alert: 'bolt',
    message: 'gift',
    outage: 'exclamation-circle'
  };

  /**
   * Sets global vars, initiates API request and triggers dom adjustments based
   * on request results
   * @function init
   * @private
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
    if (config.parameters.notificationURL) {
      url = 'https://status.earthdata.nasa.gov/api/v1/notifications?domain=' + config.parameters.notificationURL;
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

  /**
   * Sets active state global values
   * @function getPriority
   * @private
   * @param {object} sortedNotifications - object that contains categorized
   * notifications
   * @returns {void}
   */
  var getPriority = function (sortedNotifications) {
    var priority, message, outage, alert;

    priority = null;
    message = sortedNotifications.messages[0];
    outage = sortedNotifications.outages[0];
    alert = sortedNotifications.alerts[0];

    if (outage || alert || message) {
      alertBlockExists = true;
    }

    if (message && !objectAlreadySeen(message)) {
      priority = 'message';
      mainNotification = 'message';
      activeNotifications.message = message.created_at;
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

  /**
   * Gets a count of the unseen notifications
   * @function getCounts
   * @private
   * @returns {array}
   */
  var getCounts = function () {
    var outageCount, messageCount, alertCount;

    messageCount = getNumberOfTypeNotSeen('message', sortedNotifications.messages); // Number of messages not yet seen
    alertCount = getNumberOfTypeNotSeen('alert', sortedNotifications.alerts); // Number of alerts not yet seen
    outageCount = getNumberOfTypeNotSeen('outage', sortedNotifications.outages); // Number of outages not yet seen

    return {
      messageCount: messageCount,
      outageCount: outageCount,
      alertCount: alertCount
    };
  };

  /**
   * Updates the main icon with the number of unseen notifications
   * @function update
   * @private
   * @return {void}
   */
  var update = function () {
    var alertCount, outageCount, messageCount, counts, priority;

    counts = getCounts();
    alertCount = counts.alertCount;
    outageCount = counts.outageCount;
    messageCount = counts.messageCount;
    priority = getPriority(sortedNotifications);

    updateMainIcon(priority, alertCount + outageCount + messageCount);
  };

  /**
   * Determines the number of status of this type that the user is yet to see
   * @function getNumberOfTypeNotSeen
   * @private
   * @param {string} type - Status type
   * @param {object} arra - array of status of one type
   * @returns {Number} count - number of unseen messages in LocalStorage
   */
  var getNumberOfTypeNotSeen = function (type, arra) {
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

  /**
   * Determines if most recent notification has already been seen
   * @function objectAlreadySeen
   * @private
   * @param {object} obj - object from API array
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

  /**
   * Categorizes the returned array
   * @function separateByType
   * @private
   * @param {object} obj - array from API
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

  /**
   * Organizes array by date created
   * @function orderByDate
   * @private
   * @param {object} obj - array
   * @returns {void}
   */
  var orderByDate = function (obj) {
    obj.sort(function (a, b) {
      return new Date(b.created_at) - new Date(a.created_at);
    });

    return obj;
  };

  /**
   * Manipulates the Info Icon's class name
   * @function updateMainIcon
   * @private
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

  /**
   * Creates a notification menu item and attaches event listeners to the element
   * @function getAlert
   * @static
   * @returns {object} a jquery element
   */
  self.getAlert = function () {
    var $notifyMenuItem, alertsNumber, outagesNumber, messagesNumber, count, hide;

    if (!lodashIsEmpty(activeNotifications)) {
      messagesNumber = getNumberOfTypeNotSeen('message', sortedNotifications.messages);
      alertsNumber = getNumberOfTypeNotSeen('alert', sortedNotifications.alerts);
      outagesNumber = getNumberOfTypeNotSeen('outage', sortedNotifications.outages);
      count = outagesNumber + alertsNumber + messagesNumber;
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

  /**
   * Adds API element to localstorage, deactives notification active states,
   * and updates the info icon
   * @function notify
   * @private
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

    if (activeNotifications.message) {
      localStorage.setItem('message', activeNotifications.message);
    }

    activeNotifications = {};

    if (self.messageIconActive) {
      mainNotification = 'message';
    }

    update();
  };

  /**
   * Adds API element to localstorage, deactives notification active states,
   * and updates the info icon
   * @function createNotifyDialog
   * @private
   * @returns {void}
   */
  var createNotifyDialog = function () {
    var $dialog, dimensions, $notifyContent;

    $notifyContent = $('<div class="wv-notify-modal"></div>');

    if (!sortedNotifications.alerts && !sortedNotifications.outages && !sortedNotifications.messages) {
      return null;
    }

    dimensions = getModalDimensions();

    $notifyContent.append(create$block(sortedNotifications.outages, 'outage'));
    $notifyContent.append(create$block(sortedNotifications.alerts, 'alert'));
    $notifyContent.append(create$block(sortedNotifications.messages, 'message'));
    $dialog = wvui.getDialog().append($notifyContent);

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
      },
      closeText: ''
    });
  };

  /**
   * Gets proper size for modal
   * @function createNotifyDialog
   * @private
   * @returns {Object} Dimension array
   */
  var getModalDimensions = function () {
    var width, height;

    width = 625;
    height = 'auto';

    if (util.browser.small) {
      width = $(window)
        .width();
      height = $(window)
        .height();
    }

    return [width, height];
  };

  /**
   * Creates a Feed of Jquery list items
   * @function create$block
   * @private
   * @param {Object} arra - array of objects
   * @param {string} title - title
   * @returns {Object} Jquery ul element
   */
  var create$block = function (arra, title) {
    var $li;
    var date;
    var numNotSeen;
    var activeClass;
    var $ul = $('<ul></ul>');

    numNotSeen = getNumberOfTypeNotSeen(title, sortedNotifications[title + 's']);

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

  /**
   * Checks to see if id or smaller #id is in localstorage
   * @function localStorageValueMatches
   * @private
   * @param {String} property - name of category type
   * @param {string} value - id of notification
   * @returns {Boolean}
   */
  var localStorageValueMatches = function (property, value) {
    var oldValue = localStorage.getItem(property);
    return new Date(value) <= new Date(oldValue);
  };

  init();
  return self;
};
