/* This file is just a stub to test the browserify build task */

import { jQuery as $ } from 'jquery';
import { GA } from 'worldview-components';
import linkModel from './link/link.model';
import linkUI from './link/link.ui';
import layersInfo from './layers/layers.info';

export default function () {
  console.log($, GA, linkUI, linkModel, layersInfo);
};
