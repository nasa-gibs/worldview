/* This file is just a stub to test the browserify build task */

import { jQuery as $ } from 'jquery';
import { DateSelector } from 'worldview-components';

export default function () {
  console.log($, DateSelector);
};
