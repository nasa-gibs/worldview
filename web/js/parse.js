import { each as lodashEach } from 'lodash';
import { mapParser } from './map/map';
import { parse as dateParser } from './date/date';
import { parse as projectionParser } from './projection/projection';
import { parse as layerParser } from './layers/layers';
import { parse as animationParser } from './animation/anim';
import palettes from './palettes/palettes';
import { dataParser } from './data/data';

export function parse(parameters, config, errors) {
  let state = parameters;
  let parsers = [
    projectionParser,
    layerParser,
    dateParser,
    mapParser,
    palettes.parse
  ];
  if (config.features.dataDownload) {
    parsers.push(dataParser);
  }
  if (config.features.animation) {
    parsers.push(animationParser);
  }
  lodashEach(parsers, function(parser) {
    parser(state, errors, config);
  });
  return state;
}
