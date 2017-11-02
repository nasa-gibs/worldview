/* This file is just a stub to test the browserify build task */

import { jQuery as $ } from 'jquery';
import { GA } from 'worldview-components';
import linkModel from './link/link.model';
import linkUi from './link/link.ui';
import { parse as layerParser, validate as layerValidate } from './layers/layers';
import layersAdd from './layers/layers.add';
import layersActive from './layers/layers.active';
import layersInfo from './layers/layers.info';
import layersModal from './layers/layers.modal';
import layersModel from './layers/layers.model';
import layersOptions from './layers/layers.options';
import layersSidebar from './layers/layers.sidebar';
import palettes from './palettes/palettes';
import palettesLegend from './palettes/palettes.legend';
import palettesModel from './palettes/palettes.model';

export default function () {
  console.log($, GA, linkUi, linkModel, layerParser, layerValidate, layersAdd, layersActive, layersInfo, layersModal, layersModel, layersOptions, layersSidebar, palettes, palettesLegend, palettesModel);
};
