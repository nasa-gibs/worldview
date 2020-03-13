export const REQUEST_NOTIFICATIONS = 'NOTIFICATIONS/REQUEST_APP_NOTIFICATIONS';
export const REQUEST_NOTIFICATIONS_START = 'NOTIFICATIONS/REQUEST_APP_NOTIFICATIONS_START';
export const REQUEST_NOTIFICATIONS_SUCCESS = 'NOTIFICATIONS/REQUEST_APP_NOTIFICATIONS_SUCCESS';
export const REQUEST_NOTIFICATIONS_FAILURE = 'NOTIFICATIONS/REQUEST_APP_NOTIFICATIONS_FAILURE';
export const SET_NOTIFICATIONS = 'NOTIFICATIONS/SET_NOTIFICATION_RESPONSE';
export const NOTIFICATIONS_SEEN = 'NOTIFICATIONS/NOTIFICATIONS_HAVE_BEEN_SEEN';

export const STATUS_REQUEST_URL = 'https://status.earthdata.nasa.gov/api/v1/notifications?domain=https%3A%2F%2Fworldview.earthdata.nasa.gov';
export const MOCK_RESPONSE_BODY = [
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
    path: '',
  },
];
export const MOCK_RESPONSE = {
  success: true,
  notifications: MOCK_RESPONSE_BODY,
};
export const MOCK_SORTED_NOTIFICATIONS = {
  messages: [],
  outages: [
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
      path: '',
    },
  ],
  alerts: [],
};
