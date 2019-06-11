import { each as lodashEach } from 'lodash';
import { mapParser } from './map/map';
// import { parse as dateParser } from './date/date';
// import { parse as projectionParser } from './projection/projection';
// import { parse as layerParser } from './layers/layers';
// import { parse as animationParser } from './animation/anim';
import { parsePalettes } from './modules/palettes/util';
// import { dataParser } from './map/data/data';

export function parse(parameters, config, errors) {
  let state = parameters;
  let parsers = [
    mapParser,
    parsePalettes // legacy palette parser e.g.state.palette in permalink
  ];

  lodashEach(parsers, function(parser) {
    parser(state, errors, config);
  });
  return state;
}
