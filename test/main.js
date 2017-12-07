// This file is an entry point used to build a testable bundle of the WV core
// It exposes some internal methods on a global `wv` var for testing purposes
import underscore from 'underscore';
import 'babel-polyfill'; // Polyfill fixes a bug in Phantom 2.1.x
import brand from '../web/js/brand';
import { parse as dateParser } from '../web/js/date/date';
import { dateModel } from '../web/js/date/model';
import { parse as layerParser } from '../web/js/layers/layers';
import { layersModel } from '../web/js/layers/model';
import { projectionModel } from '../web/js/projection/model';
import util from '../web/js/util/util';
import fixtures from './fixtures.js';

window.wv = {
  brand: brand,
  date: {
    parse: dateParser,
    model: dateModel
  },
  layers: {
    parse: layerParser,
    model: layersModel
  },
  proj: {
    model: projectionModel
  },
  util: util
};

window.fixtures = fixtures;
window._ = underscore;
