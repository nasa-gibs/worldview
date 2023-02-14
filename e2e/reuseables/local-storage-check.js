/* eslint-disable object-shorthand */
module.exports = {
  localStorageEnabled: function () {
    let enabled
    try {
      if (window.localStorage) {
        const uid = new Date().toString()
        window.localStorage.setItem(uid, uid)
        enabled = window.localStorage.getItem(uid) === uid
        window.localStorage.removeItem(uid)
      }
    } catch (error) {
      enabled = false
    }
    return !!enabled
  }
}
