/* eslint-disable */

export default {
  /*
  * @func dataLayerPush object to GoogleTagManager
  * can add custom javascript object that can be retrieved as custom data layer variables
  * @static
  *
  * @param EventObject {object}
  *
  * @return {void}
  */
  pushEvent(eventObject) {
    if (typeof (dataLayer) !== 'undefined') {
      window.dataLayer.push(eventObject);
    }
  },

  /*
  * @func getIpAddress
  * get user IP address for GTM/GA using https://www.ipify.org/ API
  * @static
  *
  * @return {void}
  */
  // get user IP address for GTM/GA using https://www.ipify.org/ API
  async getIpAddress() {
    const response = await fetch('https://api.ipify.org?format=json');
    const json = await response.json();
    const ipAddress = json.ip;

    this.pushEvent({
      event: 'ipAddress',
      ipAddress,
    });
  }
};
