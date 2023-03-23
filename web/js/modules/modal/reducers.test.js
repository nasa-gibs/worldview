import { assign as lodashAssign } from 'lodash';
import * as constants from './constants';
import { modalReducer, modalState } from './reducers';
import util from '../../util/util';

describe('main modalReducer', () => {
  test('should return the initial state', () => {
    expect(modalReducer(undefined, {})).toEqual(modalState);
  });
  test(`${constants.TOGGLE}action type should toggle open value [modal-reducer-toggle]`, () => {
    const modalToggledOpenObj = { isOpen: true };
    expect(
      modalReducer([], {
        type: constants.TOGGLE,
      }),
    ).toEqual(modalToggledOpenObj);
  });
  test(
    `${constants.OPEN_BASIC}action type should update various modal props [modal-reducer-open]`,
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
    `${constants.OPEN_CUSTOM} action type should update various modal props [modal-reducer-open-custom]`,
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
    } action type should update various modal props [modal-reducer-render-template]`,
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
