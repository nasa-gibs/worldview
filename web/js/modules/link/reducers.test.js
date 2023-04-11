import { linkReducer, defaultLinkState, shortLink } from './reducers';
import * as constants from './constants';
import { defaultRequestState } from '../core/reducers';

describe('shortLink reducer', () => {
  test('should return the initial state [link-reducer-initial-state]', () => {
    expect(shortLink([], {})).toEqual(defaultRequestState);
  });
  test('Should set isLoading to true on Request Start', () => {
    expect(
      shortLink([], {
        type: constants.REQUEST_SHORT_LINK_START,
      }),
    ).toEqual({
      isLoading: true,
      error: null,
      response: null,
      type: null,
    });
  });
  test('Should return response upon request success [link-reducer-success-response]', () => {
    expect(
      shortLink([], {
        type: constants.REQUEST_SHORT_LINK_SUCCESS,
        response: constants.MOCK_SHORT_LINK_RESPONSE_BODY,
      }),
    ).toEqual({
      isLoading: false,
      error: null,
      response: constants.MOCK_SHORT_LINK_RESPONSE_BODY,
      type: null,
    });
  });
});
describe('linkReducer', () => {
  test('should return the initial state [link-reducer-return-initial-state]', () => {
    expect(linkReducer(undefined, {})).toEqual(defaultLinkState);
  });
  test(
    `${constants.UPDATE_PERMALINK
    }action type should return object containing sorted mock object [link-reducer-mock-object]`,
    () => {
      const testString = 'thisIsATestString';
      expect(
        linkReducer([], {
          type: constants.UPDATE_PERMALINK,
          queryString: testString,
        }),
      ).toEqual({
        queryString: testString,
      });
    },
  );
});
