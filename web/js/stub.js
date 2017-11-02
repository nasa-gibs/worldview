/* This file is just a stub to test the browserify build task */

import $ from 'jquery';
import GA from 'worldview-components';

export function stub() {
  console.log($, GA);
};

export const stub2 = (function() {
  return 'stub';
})();
