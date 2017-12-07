// This file is an entry point used to build a testable bundle of the WV core
// It exposes some internal methods on a global `wv` var for testing purposes
import brand from '../web/js/brand';
import { parse as dateParser } from '../web/js/date/date';
import { dateModel } from '../web/js/date/model';
import util from '../web/js/util/util';
import fixtures from './fixtures.js';

window.wv = {
  brand: brand,
  date: {
    parse: dateParser,
    model: dateModel
  },
  util: util
};

window.fixtures = fixtures;
