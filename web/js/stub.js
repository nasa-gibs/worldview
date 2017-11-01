/* This file is just a stub to test the browserify build task */

import { jQuery as $ } from 'jquery';
import { GA } from 'worldview-components';

export default function () {
  console.log($, GA);
};
