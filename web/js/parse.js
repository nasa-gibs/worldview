import { each as lodashEach } from 'lodash';
import { mapParser } from './map/map';

export function parse(parameters, config, errors) {
  let state = parameters;
  let parsers = [mapParser];

  lodashEach(parsers, function(parser) {
    parser(state, errors, config);
  });
  return state;
}
