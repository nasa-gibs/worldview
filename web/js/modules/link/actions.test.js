import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock from 'fetch-mock';
import * as actions from './actions';
import * as constants from './constants';
const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

const RESPONSE_BODY = {
  data: {
    url: 'http://go.nasa.gov/1iKIZ4j'
  },
  status_code: 200,
  status_txt: 'OK'
};

const MOCK_RESPONSE = {
  success: true,
  notifications: RESPONSE_BODY
};

describe('Short Link fetch action', () => {
  test(
    'creates ' +
      constants.REQUEST_SHORT_LINK_SUCESSS +
      ' when short link is complete',
    () => {
      const loc = 'mock/';
      fetchMock.getOnce(loc, {
        body: MOCK_RESPONSE,
        headers: {
          'content-type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      });
      const expectedActions = [
        { type: constants.REQUEST_SHORT_LINK_START },
        {
          type: constants.REQUEST_SHORT_LINK_SUCCESS,
          response: MOCK_RESPONSE
        }
      ];
      const store = mockStore({ shortLink: {} });
      return store.dispatch(actions.requestShortLink(loc, 'json')).then(() => {
        expect(store.getActions()).toEqual(expectedActions);
      });
    }
  );
});
describe('updatePermalink action', () => {
  test(
    constants.UPDATE_PERMALINK + ' action type returns new permalink',
    () => {
      const testString = 'thisIsATestString';
      const expectedAction = {
        type: constants.UPDATE_PERMALINK,
        queryString: testString
      };
      expect(actions.updatePermalink(testString)).toEqual(expectedAction);
    }
  );
});
