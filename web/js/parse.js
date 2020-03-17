import { each as lodashEach } from 'lodash';
import { mapParser } from './map/map';

export function parse(parameters, config, errors) {
  const state = parameters;
  const parsers = [mapParser];

  lodashEach(parsers, (parser) => {
    parser(state, errors, config);
  });
  return state;
}
