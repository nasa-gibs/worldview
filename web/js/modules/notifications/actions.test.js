import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock from 'fetch-mock';
import * as actions from './actions';
import * as types from './constants';
const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);

const RESPONSE_BODY = [
  {
    id: 537,
    notification_type: 'outage',
    message: 'This is a test Outage',
    updated_at: '2018-05-20T16:26:43.013-04:00',
    created_at: '2018-05-20T16:23:37.049-04:00',
    starttime: null,
    endtime: null,
    applications: ['Worldview (OPS)'],
    domains: ['https://worldview.earthdata.nasa.gov'],
    dismissible: true,
    path: ''
  }
];
const MOCK_RESPONSE = {
  success: true,
  notifications: RESPONSE_BODY
};

describe('Notification fetch action', () => {
  afterEach(() => {
    fetchMock.restore();
  });
  it('creates REQUEST_APP_NOTIFICATIONS_SUCCESS when fetching notifications is complete', () => {
    const loc = 'mock/notify-outage.json';
    fetchMock.getOnce(loc, {
      body: MOCK_RESPONSE,
      headers: {
        'content-type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
    const expectedActions = [
      { type: types.REQUEST_NOTIFICATIONS_START },
      {
        type: types.REQUEST_NOTIFICATIONS_SUCCESS,
        response: JSON.stringify(MOCK_RESPONSE)
      }
    ];
    const store = mockStore({ notifications: {} });
    return store
      .dispatch(actions.requestNotifications(loc, 'json'))
      .then(() => {
        expect(store.getActions()).toEqual(expectedActions);
      });
  });
});
