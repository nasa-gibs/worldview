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
describe('Notification fetch action', () => {
  afterEach(() => {
    fetchMock.restore();
  });
  test('triggers start and success action types [notifications-actions-success]', () => {
    const loc = 'mock/';
    fetchMock.getOnce(loc, {
      body: constants.MOCK_RESPONSE,
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    const expectedActions = [
      { type: constants.REQUEST_NOTIFICATIONS_START },
      {
        type: constants.REQUEST_NOTIFICATIONS_SUCCESS,
        response: JSON.stringify(constants.MOCK_RESPONSE),
      },
    ];
    const store = mockStore({ notifications: {} });
    return store
      .dispatch(actions.requestNotifications(loc))
      .then(() => {
        expect(store.getActions()).toEqual(expectedActions);
      });
  });
  test(`creates ${constants.REQUEST_NOTIFICATIONS_FAILURE} Action [notifications-actions-failure]`, () => {
    const loc = 'mock/';
    fetchMock.mock(loc, {
      throws: ERROR_MESSAGE,
    });
    const expectedActions = [
      { type: constants.REQUEST_NOTIFICATIONS_START },
      {
        type: constants.REQUEST_NOTIFICATIONS_FAILURE,
        error: ERROR_MESSAGE,
      },
    ];
    const store = mockStore({ shortLink: {} });
    return store
      .dispatch(actions.requestNotifications(loc))
      .catch(() => {
        expect(store.getActions()).toEqual(expectedActions);
      });
  });
});
describe('Notification post-request actions [notifications-actions-post-request]', () => {
  test(
    `setNotification action returns ${
      constants.SET_NOTIFICATIONS
    } action type with array`,
    () => {
      const expectedAction = {
        type: constants.SET_NOTIFICATIONS,
        array: ['alerts', 'outages', 'messages'],
      };
      expect(
        actions.setNotifications(['alerts', 'outages', 'messages']),
      ).toEqual(expectedAction);
    },
  );
  test(
    `notificationsSeen action returns ${
      constants.NOTIFICATIONS_SEEN
    } action type [notifications-actions-seen]`,
    () => {
      const expectedAction = {
        type: constants.NOTIFICATIONS_SEEN,
      };
      expect(actions.notificationsSeen()).toEqual(expectedAction);
    },
  );
});
