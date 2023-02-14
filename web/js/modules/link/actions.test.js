import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock from 'fetch-mock';
import { TextEncoder, TextDecoder } from 'util';
import * as actions from './actions';
import * as constants from './constants';

// jsdom polyfills
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);
const ERROR_MESSAGE = 'There was an error';
// throw new Error(ERROR_MESSAGE);
describe('Short Link request action', () => {
  afterEach(() => {
    fetchMock.restore();
  });

  test(
    `creates ${
      constants.REQUEST_SHORT_LINK_SUCESSS
    } when short link is complete`,
    () => {
      const loc = 'mock/';
      fetchMock.getOnce(loc, {
        body: constants.MOCK_SHORT_LINK_RESPONSE,
        headers: {
          'content-type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
      const expectedActions = [
        { type: constants.REQUEST_SHORT_LINK_START },
        {
          type: constants.REQUEST_SHORT_LINK_SUCCESS,
          response: constants.MOCK_SHORT_LINK_RESPONSE,
        },
      ];
      const store = mockStore({ shortLink: {} });
      return store
        .dispatch(actions.requestShortLink(loc, 'application/json'))
        .then(() => {
          expect(store.getActions()).toEqual(expectedActions);
        });
    },
  );
  test(`creates ${constants.REQUEST_SHORT_LINK_FAILURE} Action`, () => {
    const loc = 'mock/';
    fetchMock.mock(loc, {
      throws: ERROR_MESSAGE,
    });
    const expectedActions = [
      { type: constants.REQUEST_SHORT_LINK_START },
      {
        type: constants.REQUEST_SHORT_LINK_FAILURE,
        error: ERROR_MESSAGE,
      },
    ];
    const store = mockStore({ shortLink: {} });
    return store
      .dispatch(actions.requestShortLink(loc, 'application/json'))
      .catch(() => {
        expect(store.getActions()).toEqual(expectedActions);
      });
  });
});
describe('updatePermalink action', () => {
  test(
    `${constants.UPDATE_PERMALINK} action type returns new permalink`,
    () => {
      const testString = 'thisIsATestString';
      const expectedAction = {
        type: constants.UPDATE_PERMALINK,
        queryString: testString,
      };
      expect(actions.updatePermalink(testString)).toEqual(expectedAction);
    },
  );
});
