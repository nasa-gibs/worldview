import { TextEncoder, TextDecoder } from 'util';
import configureMockStore from 'redux-mock-store';
import { thunk } from 'redux-thunk';
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
  beforeEach(() => {
    fetch.resetMocks();
  });

  test(
    `creates ${
      constants.REQUEST_SHORT_LINK_SUCCESS
    } when short link is complete [link-actions-request-short-link]`,
    () => {
      const loc = 'mock/';
      fetch.mockResponseOnce(JSON.stringify(constants.MOCK_SHORT_LINK_RESPONSE));
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
  test(`creates ${constants.REQUEST_SHORT_LINK_FAILURE} Action [link-actions-failure]`, () => {
    const loc = 'mock/';
    fetch.mockRejectOnce(ERROR_MESSAGE);
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
    `${constants.UPDATE_PERMALINK} action type returns new permalink [link-actions-update-permalink]`,
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
