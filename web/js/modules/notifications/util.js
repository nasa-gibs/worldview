import safeLocalStorage from '../../util/local-storage';

const {
  NOTIFICATION_OUTAGE,
  NOTIFICATION_ALERT,
  NOTIFICATION_MSG,
} = safeLocalStorage.keys;

// Notifications containing this string in their path property will be treated
// as layer notices which only show if the specified layers are in the active list
const LAYER_NOTICE = 'layer-notice';

/**
 * Categorizes the returned array
 * @function separateByType
 * @private
 * @param {object} obj - array from API
 * @returns {void}
 */
export function separateByType(notifications) {
  const messages = [];
  const alerts = [];
  const outages = [];
  const layerNotices = [];
  const orderByDate = (obj) => {
    obj.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return obj;
  };

  notifications.forEach((notification) => {
    const { notification_type: type, path } = notification;

    if (path.includes(LAYER_NOTICE)) {
      layerNotices.push(notification);
      return;
    }
    if (type === NOTIFICATION_MSG) {
      messages.push(notification);
    } else if (type === NOTIFICATION_ALERT) {
      alerts.push(notification);
    } else if (type === NOTIFICATION_OUTAGE) {
      outages.push(notification);
    }
  });

  return {
    messages: orderByDate(messages),
    alerts: orderByDate(alerts),
    outages: orderByDate(outages),
    layerNotices: transformLayerNotices(orderByDate(layerNotices)),
  };
}

/**
 * Sets active state global values
 * @function getPriority
 * @private
 * @param {object} sortedNotifications - object that contains categorized
 * notifications
 * @returns {void}
 */
export function getPriority(sortedNotifications) {
  let priority = '';
  const [message] = sortedNotifications.messages;
  const [outage] = sortedNotifications.outages;
  const [alert] = sortedNotifications.alerts;

  if (message && !objectAlreadySeen(message)) {
    priority = NOTIFICATION_MSG;
  }

  if (alert && !objectAlreadySeen(alert)) {
    priority = NOTIFICATION_ALERT;
  }

  if (outage && !objectAlreadySeen(outage)) {
    priority = NOTIFICATION_OUTAGE;
  }

  // TODO need to determine how and when layer notices affect priority

  return priority;
}

/**
 * Gets a total count of the unseen notifications
 * @function getCounts
 * @private
 * @returns {Number}
 */
export function getCount(notifications) {
  const {
    messages, outages, alerts,
  } = notifications;
  const messageCount = getNumberOfTypeNotSeen(NOTIFICATION_MSG, messages);
  const alertCount = getNumberOfTypeNotSeen(NOTIFICATION_ALERT, alerts);
  const outageCount = getNumberOfTypeNotSeen(NOTIFICATION_OUTAGE, outages);

  return messageCount + outageCount + alertCount;
}

export function addToLocalStorage({ messages, outages, alerts }) {
  const [message] = messages;
  const [outage] = outages;
  const [alert] = alerts;

  if (outage) {
    safeLocalStorage.setItem(NOTIFICATION_OUTAGE, outage.created_at);
  }
  if (alert) {
    safeLocalStorage.setItem(NOTIFICATION_ALERT, alert.created_at);
  }
  if (message) {
    safeLocalStorage.setItem(NOTIFICATION_MSG, message.created_at);
  }
}

/**
 * Determines the number of status of this type that the user is yet to see
 * @function getNumberOfTypeNotSeen
 * @private
 * @param {string} type - Status type
 * @param {object} arra - array of status of one type
 * @returns {Number} count - number of unseen messages in LocalStorage
 */
export function getNumberOfTypeNotSeen(type, arra) {
  const storageItem = safeLocalStorage.getItem(type);
  const len = arra.length;
  let count = 0;

  if (!storageItem) {
    return len;
  }

  for (let i = 0; i < len; i += 1) {
    if (new Date(storageItem) < new Date(arra[i].created_at)) {
      count += 1;
    } else {
      return count;
    }
  }

  return count;
}

/**
 * Determines if most recent notification has already been seen
 * @function objectAlreadySeen
 * @private
 * @param {object} obj - object from API array
 * @returns {void}
 */
function objectAlreadySeen(obj) {
  const type = obj.notification_type;
  const idString = obj.created_at.toString();
  let fieldValueMatches = false;
  const fieldExists = !!safeLocalStorage.getItem(type);
  const localStorageValueMatches = (property, value) => {
    const oldValue = safeLocalStorage.getItem(property);
    return oldValue && new Date(value) <= new Date(oldValue);
  };

  if (fieldExists) {
    fieldValueMatches = localStorageValueMatches(type, idString);
  }
  return fieldValueMatches;
}

export function transformLayerNotices(notifications) {
  return notifications.map((notice) => {
    const splitPath = notice.path.split('/');
    const layers = splitPath.slice(2, splitPath.length);
    return {
      ...notice,
      layers,
    };
  });
}

export function getLayerNoticesForLayer(layer, notifications) {
  const { layerNotices } = notifications.object;
  const notices = (layerNotices || []).filter((notice) => notice.layers.includes(layer));
  return notices.reduce((noticeStr, notice) => `${noticeStr}  <div>${notice.message}</div>`, '');
}
