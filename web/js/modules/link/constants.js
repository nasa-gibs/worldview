export const TOGGLE_URL = 'TOGGLE_SHARE_LINK';
export const UPDATE_PERMALINK = 'UPDATE_PERMALINK';

export const REQUEST_SHORT_LINK_START = 'REQUEST_BITLY_SHORTENED_LINK_START';
export const REQUEST_SHORT_LINK_SUCCESS = 'REQUEST_BITLY_SHORTENED_LINK_SUCCESS';
export const REQUEST_SHORT_LINK_FAILURE = 'REQUEST_BITLY_SHORTENED_LINK_FAILURE';
export const REQUEST_SHORT_LINK = 'REQUEST_BITLY_SHORTENED_LINK';

export const MOCK_SHORT_LINK_RESPONSE_BODY = {
  data: {
    url: 'http://go.nasa.gov/1iKIZ4j',
  },
  status_code: 200,
  status_txt: 'OK',
};

export const MOCK_SHORT_LINK_RESPONSE = {
  success: true,
  notifications: MOCK_SHORT_LINK_RESPONSE_BODY,
};

export const ENCODING_EXCEPTIONS = [
  {
    match: new RegExp('%2C', 'g'),
    replace: ',',
  },
  {
    match: new RegExp('%3B', 'g'),
    replace: ';',
  },
  {
    match: new RegExp('%3D', 'g'),
    replace: '=',
  },
];
