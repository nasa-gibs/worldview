import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock from 'fetch-mock';
import fixtures from '../../fixtures';
import layerbuilder from '../layerbuilder';
import granuleLayerBuilder from './granule-layer-builder';
import { LOADING_START, LOADING_STOP } from '../../modules/loading/constants';
import { LOADING_GRANULES } from '../../modules/loading/actions';
import { ADD_GRANULE_LAYER_DATES } from '../../modules/layers/constants';
import { OPEN_BASIC } from '../../modules/modal/constants';


const mockBaseCmrApi = 'mock.cmr.api/';
const queryString = '?shortName=VJ102MOD&temporal=2019-09-23T00%3A00%3A00.000Z%2C2019-09-25T00%3A00%3A00.000Z&pageSize=2000';
const cmrGranules = require('../../../mock/cmr_granules.json');

fetchMock.mock(`${mockBaseCmrApi}granules.json${queryString}`, cmrGranules)
  .mock('*', 404);

const mockStore = configureMockStore([thunk]);
const config = fixtures.config();
const { cache } = fixtures;
const granuleLayerDef = config.layers['granule-cr'];

let createGranuleLayer;
let store;

const expectedDates = [
  '2019-09-23T02:18:00Z',
  '2019-09-23T03:42:00Z',
  '2019-09-23T03:48:00Z',
  '2019-09-23T03:54:00Z',
  '2019-09-23T04:00:00Z',
  '2019-09-23T05:18:00Z',
  '2019-09-23T05:24:00Z',
  '2019-09-23T05:30:00Z',
  '2019-09-23T05:36:00Z',
  '2019-09-23T05:42:00Z',
  '2019-09-23T07:00:00Z',
  '2019-09-23T07:06:00Z',
  '2019-09-23T07:12:00Z',
  '2019-09-23T07:18:00Z',
  '2019-09-23T07:24:00Z',
  '2019-09-23T08:42:00Z',
  '2019-09-23T08:48:00Z',
  '2019-09-23T08:54:00Z',
  '2019-09-23T09:00:00Z',
  '2019-09-23T09:06:00Z',
];

describe('granule layer builder', () => {
  beforeEach(() => {
    store = mockStore(fixtures.getState());
    const { createLayerWMTS } = layerbuilder(config, cache, store);
    const { getGranuleLayer } = granuleLayerBuilder(cache, store, createLayerWMTS);
    createGranuleLayer = getGranuleLayer;
  });

  it('dispatches expected actions', async () => {
    const options = {
      group: 'active',
      date: new Date(Date.UTC('2019', '08', '24', '08', '54', '00')),
    };
    const attributes = {
      ...options,
      def: granuleLayerDef,
    };
    await createGranuleLayer(granuleLayerDef, attributes, options);
    const [firstAction, secondAction, thirdAction] = store.getActions();

    expect(firstAction.type).toEqual(LOADING_START);
    expect(firstAction.key).toEqual(LOADING_GRANULES);
    expect(secondAction.type).toEqual(LOADING_STOP);
    expect(secondAction.key).toEqual(LOADING_GRANULES);
    expect(thirdAction.type).toEqual(ADD_GRANULE_LAYER_DATES);
    expect(thirdAction.dates).toEqual(expectedDates);
    expect(Object.keys(thirdAction.granuleFootprints)).toEqual(expectedDates);
    expect(thirdAction.count).toEqual(thirdAction.dates.length);
  });

  it('dispatches modal open action when CMR unreachable', async () => {
    const options = {
      group: 'active',
      date: new Date(Date.UTC('2016', '08', '24', '08', '54', '00')),
    };
    const attributes = {
      ...options,
      def: granuleLayerDef,
    };
    await createGranuleLayer(granuleLayerDef, attributes, options);
    const [firstAction, secondAction] = store.getActions();

    expect(firstAction.type).toEqual(LOADING_START);
    expect(firstAction.key).toEqual(LOADING_GRANULES);
    // CMR unreachable modal opened
    expect(secondAction.type).toEqual(OPEN_BASIC);
  });

  it('sets expected layer properties', async () => {
    const options = {
      group: 'active',
      date: new Date(Date.UTC('2019', '08', '24', '08', '54', '00')),
    };
    const attributes = {
      ...options,
      def: granuleLayerDef,
    };
    const granuleLayer = await createGranuleLayer(granuleLayerDef, attributes, options);
    const filteredDates = granuleLayer.wv.filteredGranules.map(({ date }) => date);

    expect(granuleLayer.get('granuleGroup')).toEqual(true);
    expect(granuleLayer.wv.granuleDates).toEqual(expectedDates);
    expect(filteredDates).toEqual(expectedDates);
  });
});
