/* eslint-disable no-console */
const enabled = (function() {
  try {
    if (window.localStorage) {
      const uid = new Date().toString();
      localStorage.setItem(uid, uid);
      const result = localStorage.getItem(uid) === uid;
      localStorage.removeItem(uid);
      return result && true;
    }
  } catch (error) {
    console.warn('Local storage disabled.');
    return false;
  }
}());

const safeLocalStorage = {
  enabled,
  getItem(key) {
    if (enabled) {
      return localStorage.getItem(key);
    }
  },
  setItem(key, value) {
    if (enabled) {
      localStorage.setItem(key, value);
    }
  },
  removeItem(key) {
    if (enabled) {
      localStorage.removeItem(key);
    }
  },
};

export default safeLocalStorage;
