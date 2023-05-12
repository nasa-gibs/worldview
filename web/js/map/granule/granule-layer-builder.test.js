import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock from 'fetch-mock';
import fixtures from '../../fixtures';
import layerbuilder from '../layerbuilder';
import granuleLayerBuilder from './granule-layer-builder';
// import { LOADING_START, LOADING_STOP } from '../../modules/loading/constants';
// import { LOADING_GRANULES } from '../../modules/loading/actions';
// import { ADD_GRANULE_LAYER_DATES } from '../../modules/layers/constants';

const mockBaseCmrApi = 'mock.cmr.api/';
const queryString = '?bounding_box=-180%2C-65%2C180%2C65&shortName=VJ102IMG&day_night_flag=DAY&temporal=2019-09-23T20%3A54%3A00.000Z%2C2019-09-24T12%3A54%3A00.000Z&pageSize=500';
const cmrGranules = require('../../../mock/cmr_granules.json');

fetchMock.mock(`${mockBaseCmrApi}granules.json${queryString}`, cmrGranules)
  .mock('*', 404);

const mockStore = configureMockStore([thunk]);
const config = fixtures.config();
const { cache } = fixtures;
const granuleLayerDef = config.layers['granule-cr'];

let createGranuleLayer;
let store;

// const expectedDates = [
//   '2019-09-23T23:12:00Z',
//   '2019-09-23T23:18:00Z',
//   '2019-09-23T23:24:00Z',
//   '2019-09-23T23:30:00Z',
//   '2019-09-23T23:54:00Z',
//   '2019-09-24T00:00:00Z',
//   '2019-09-24T00:06:00Z',
//   '2019-09-24T00:12:00Z',
//   '2019-09-24T00:18:00Z',
//   '2019-09-24T00:48:00Z',
// ];

describe('granule layer builder', () => {
  beforeEach(() => {
    store = mockStore(fixtures.getState());
    const { createLayerWMTS } = layerbuilder(config, cache, store);
    const { getGranuleLayer } = granuleLayerBuilder(cache, store, createLayerWMTS);
    createGranuleLayer = getGranuleLayer;
  });

  // TODO: fix fetchMock in jest v28+
  // it('dispatches expected actions', async () => {
  //   const options = {
  //     group: 'active',
  //     date: new Date(Date.UTC('2019', '08', '24', '08', '54', '00')),
  //   };
  //   const attributes = {
  //     ...options,
  //     def: granuleLayerDef,
  //   };
  //   await createGranuleLayer(granuleLayerDef, attributes, options);
  //   const [firstAction, secondAction, thirdAction] = store.getActions();

  //   expect(firstAction.type).toEqual(LOADING_START);
  //   expect(firstAction.key).toEqual(LOADING_GRANULES);
  //   expect(secondAction.type).toEqual(LOADING_STOP);
  //   expect(secondAction.key).toEqual(LOADING_GRANULES);
  //   expect(thirdAction.type).toEqual(ADD_GRANULE_LAYER_DATES);
  //   expect(thirdAction.dates).toEqual(expectedDates);
  //   expect(Object.keys(thirdAction.granuleFootprints)).toEqual(expectedDates);
  //   expect(thirdAction.count).toEqual(thirdAction.dates.length);
  // });

  it('doesnt query cmr when date falls outside range', async () => {
    const options = {
      group: 'active',
      date: new Date(Date.UTC('2016', '08', '24', '08', '54', '00')),
    };
    const attributes = {
      ...options,
      def: granuleLayerDef,
    };
    await createGranuleLayer(granuleLayerDef, attributes, options);
    const actions = store.getActions();
    expect(actions.length).toEqual(0);
  });

  // TODO: fix fetchMock in jest v28+
  // it('sets expected layer properties', async () => {
  //   const options = {
  //     group: 'active',
  //     date: new Date(Date.UTC('2019', '08', '24', '08', '54', '00')),
  //   };
  //   const attributes = {
  //     ...options,
  //     def: granuleLayerDef,
  //   };
  //   const granuleLayer = await createGranuleLayer(granuleLayerDef, attributes, options);
  //   const filteredDates = granuleLayer.wv.visibleGranules.map(({ date }) => date);

  //   expect(granuleLayer.get('granuleGroup')).toEqual(true);
  //   expect(granuleLayer.wv.granuleDates).toEqual(expectedDates);
  //   expect(filteredDates).toEqual(expectedDates);
  // });
});
