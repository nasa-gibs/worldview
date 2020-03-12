import { assign as lodashAssign } from 'lodash';
import { defaultRequestState } from '../core/reducers';
import * as constants from './constants';
import { modalAboutPage, modalReducer, modalState } from './reducers';
import util from '../../util/util';

describe('modalAboutPage request reducer', () => {
  test('should return the initial state', () => {
    expect(modalAboutPage([], {})).toEqual(defaultRequestState);
  });
  test('Should set isLoading to true on Request Start', () => {
    expect(
      modalAboutPage([], {
        type: constants.ABOUT_PAGE_REQUEST_START,
      }),
    ).toEqual({
      isLoading: true,
      error: null,
      response: null,
      type: null,
    });
  });
  test('Should return response upon request success ', () => {
    expect(
      modalAboutPage([], {
        type: constants.ABOUT_PAGE_REQUEST_SUCCESS,
        response: constants.MOCK_RESPONSE_BODY,
      }),
    ).toEqual({
      isLoading: false,
      error: null,
      response: constants.MOCK_RESPONSE_BODY,
      type: null,
    });
  });
});
describe('main modalReducer', () => {
  test('should return the initial state', () => {
    expect(modalReducer(undefined, {})).toEqual(modalState);
  });
  test(`${constants.TOGGLE}action type should toggle open value`, () => {
    const modalToggledOpenObj = { isOpen: true };
    expect(
      modalReducer([], {
        type: constants.TOGGLE,
      }),
    ).toEqual(modalToggledOpenObj);
  });
  test(
    `${constants.OPEN_BASIC}action type should update various modal props`,
    () => {
      const basicOpenModalObject = {
        isOpen: true,
        isCustom: false,
        id: util.encodeId(`__BASIC_MODAL__${constants.TEST_HEADER}`),
        headerText: constants.TEST_HEADER,
        bodyText: constants.TEST_BODY,
        customProps: {},
        template: null,
      };

      expect(
        modalReducer([], {
          type: constants.OPEN_BASIC,
          headerText: constants.TEST_HEADER,
          bodyText: constants.TEST_BODY,
          key: util.encodeId(`__BASIC_MODAL__${constants.TEST_HEADER}`),
        }),
      ).toEqual(basicOpenModalObject);
    },
  );
  test(
    `${constants.OPEN_CUSTOM} action type should update various modal props`,
    () => {
      const customProps = { id: 'tester' };
      const modalCustomObject = lodashAssign({}, modalState, {
        isOpen: true,
        isCustom: true,
        id: constants.TEST_KEY,
        customProps,
        template: null,
      });
      expect(
        modalReducer(modalState, {
          type: constants.OPEN_CUSTOM,
          key: constants.TEST_KEY,
          customProps,
        }),
      ).toEqual(modalCustomObject);
    },
  );
  test(
    `${constants.RENDER_TEMPLATE
    } action type should update various modal props`,
    () => {
      const template = '<html>';
      const modalCustomObject = lodashAssign({}, modalState, {
        id: util.encodeId(constants.TEST_KEY),
        template,
        headerText: constants.TEST_HEADER,
        isOpen: true,
        isCustom: false,
      });
      expect(
        modalReducer(modalState, {
          type: constants.RENDER_TEMPLATE,
          key: util.encodeId(constants.TEST_KEY),
          headerText: constants.TEST_HEADER,
          template,
        }),
      ).toEqual(modalCustomObject);
    },
  );
});
