// This file is an entry point used to build a testable bundle of the WV core
// It exposes some internal methods on a global `wv` var for testing purposes
import underscore from 'underscore';
import 'babel-polyfill'; // Polyfill fixes a bug in Phantom 2.1.x
import brand from '../web/js/brand';
import { parse as dateParser } from '../web/js/date/date';
import { dateModel } from '../web/js/date/model';
import { dataParser } from '../web/js/data/data';
import { dataModel } from '../web/js/data/model';
import { parse as layerParser } from '../web/js/layers/layers';
import { layersModel } from '../web/js/layers/model';
import { linkModel } from '../web/js/link/model';
import { mapParser } from '../web/js/map/map';
import { mapModel } from '../web/js/map/model';
import { MapRunningData } from '../web/js/map/runningdata';
import palettes from '../web/js/palettes/palettes';
import { palettesModel } from '../web/js/palettes/model';
import { parse as projectionParser } from '../web/js/projection/projection';
import { projectionModel } from '../web/js/projection/model';
import { projectionChange } from '../web/js/projection/change';
import ui from '../web/js/ui/ui';
import uiIndicator from '../web/js/ui/indicator';
import uiMouse from '../web/js/ui/mouse';
import util from '../web/js/util/util';
import fixtures from './fixtures.js';

palettes.model = palettesModel;
ui.indicator = uiIndicator;
ui.mouse = uiMouse;

window.wv = {
  brand: brand,
  data: {
    parse: dataParser,
    model: dataModel
  },
  layers: {
    parse: layerParser,
    model: layersModel
  },
  date: {
    parse: dateParser,
    model: dateModel
  },
  link: {
    model: linkModel
  },
  map: {
    parse: mapParser,
    model: mapModel,
    runningdata: MapRunningData
  },
  palettes: palettes,
  proj: {
    parse: projectionParser,
    model: projectionModel,
    change: projectionChange
  },
  ui: ui,
  util: util
};

window.fixtures = fixtures;
window._ = underscore;
