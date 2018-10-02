/* eslint-disable */

export default {
  /*
  * Initialize GTM tracking if tracking
  * code is present - will add to head in document
  * noscript will not be handled
  *
  * @func init
  * @static
  *
  * @param Category {id} GTM tracking code
  *
  * @return {void}
  */
  init(id) {
    if(id) {
      (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer',id);

        // create inline SCRIPT tag with dataLayer array and push to HEAD after TITLE tag
        let dataLayerScript = document.createElement('script');
        dataLayerScript.type = 'text/javascript';
        let inlineScript = document.createTextNode('window.dataLayer = window.dataLayer || [];');
        dataLayerScript.appendChild(inlineScript);
        document.head.insertBefore(dataLayerScript, document.head.firstElementChild.nextSibling);
    }
  },

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
  }
};
