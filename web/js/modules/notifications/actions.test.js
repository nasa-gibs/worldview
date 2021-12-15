import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock from 'fetch-mock';
import * as actions from './actions';
import * as constants from './constants';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);
const ERROR_MESSAGE = 'There was an error';
describe('Notification fetch action', () => {
  afterEach(() => {
    fetchMock.restore();
  });
  test('triggers start and success action types', () => {
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
  test(`creates ${constants.REQUEST_NOTIFICATIONS_FAILURE} Action`, () => {
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
describe('Notification post-request actions', () => {
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
    } action type`,
    () => {
      const expectedAction = {
        type: constants.NOTIFICATIONS_SEEN,
      };
      expect(actions.notificationsSeen()).toEqual(expectedAction);
    },
  );
});
