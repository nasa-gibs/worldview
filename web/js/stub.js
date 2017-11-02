/* This file is just a stub to test the browserify build task */

import { jQuery as $ } from 'jquery';
import { GA } from 'worldview-components';
import linkModel from './link/link.model';
import linkUi from './link/link.ui';
import { parse as layerParse, validate as layerValidate } from './layers/layers';
import layersAdd from './layers/layers.add';
import layersInfo from './layers/layers.info';

export default function () {
  console.log($, GA, linkUi, linkModel, layerParse, layerValidate, layersAdd, layersInfo);
};
