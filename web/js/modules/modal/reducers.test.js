import { assign as lodashAssign } from 'lodash';
import * as constants from './constants';
import { modalReducer, modalState, modalAboutReducer } from './reducers';
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

  test(`${constants.TOGGLE} action type should toggle isOpen from true to false [modal-reducer-toggle-close]`, () => {
    const openState = lodashAssign({}, modalState, { isOpen: true });
    expect(
      modalReducer(openState, {
        type: constants.TOGGLE,
      }),
    ).toEqual(lodashAssign({}, openState, { isOpen: false }));
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
    `${constants.OPEN_BASIC} action type should default to empty strings when headerText and bodyText are omitted [modal-reducer-open-basic-defaults]`,
    () => {
      const key = util.encodeId('__BASIC_MODAL__');
      const result = modalReducer(modalState, {
        type: constants.OPEN_BASIC,
        key,
      });
      expect(result.headerText).toBe('');
      expect(result.bodyText).toBe('');
      expect(result.isOpen).toBe(true);
      expect(result.isCustom).toBe(false);
    },
  );

  test(
    `${constants.OPEN_BASIC} action type should toggle isOpen when same key is already open [modal-reducer-open-basic-same-key]`,
    () => {
      const key = util.encodeId(`__BASIC_MODAL__${constants.TEST_HEADER}`);
      const openState = lodashAssign({}, modalState, { key, isOpen: true });
      const result = modalReducer(openState, {
        type: constants.OPEN_BASIC,
        key,
        headerText: constants.TEST_HEADER,
        bodyText: constants.TEST_BODY,
      });
      expect(result.isOpen).toBe(false);
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
    `${constants.OPEN_CUSTOM} action type should default to empty strings when headerText and bodyText are omitted [modal-reducer-open-custom-defaults]`,
    () => {
      const result = modalReducer(modalState, {
        type: constants.OPEN_CUSTOM,
        key: constants.TEST_KEY,
        customProps: {},
      });
      expect(result.headerText).toBe('');
      expect(result.bodyText).toBe('');
    },
  );

  test(
    `${constants.OPEN_CUSTOM} action type should toggle isOpen when same key is already open [modal-reducer-open-custom-same-key]`,
    () => {
      const openState = lodashAssign({}, modalState, { key: constants.TEST_KEY, isOpen: true });
      const result = modalReducer(openState, {
        type: constants.OPEN_CUSTOM,
        key: constants.TEST_KEY,
        customProps: {},
      });
      expect(result.isOpen).toBe(false);
    },
  );

  test(
    `${constants.RENDER_TEMPLATE} action type should update various modal props [modal-reducer-render-template]`,
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

  test(
    `${constants.RENDER_TEMPLATE} action type should default headerText to empty string when omitted [modal-reducer-render-template-defaults]`,
    () => {
      const template = '<html>';
      const result = modalReducer(modalState, {
        type: constants.RENDER_TEMPLATE,
        key: util.encodeId(constants.TEST_KEY),
        template,
      });
      expect(result.headerText).toBe('');
      expect(result.bodyText).toBe('');
      expect(result.isCustom).toBe(false);
      expect(result.template).toBe(template);
    },
  );

  test(
    `${constants.RENDER_TEMPLATE} action type should toggle isOpen when same key is already open [modal-reducer-render-template-same-key]`,
    () => {
      const key = util.encodeId(constants.TEST_KEY);
      const openState = lodashAssign({}, modalState, { key, isOpen: true });
      const result = modalReducer(openState, {
        type: constants.RENDER_TEMPLATE,
        key,
        headerText: constants.TEST_HEADER,
        template: '<html>',
      });
      expect(result.isOpen).toBe(false);
    },
  );

  test(
    `${constants.CLOSE} action type should set isOpen to false [modal-reducer-close]`,
    () => {
      const openState = lodashAssign({}, modalState, { isOpen: true });
      expect(
        modalReducer(openState, {
          type: constants.CLOSE,
        }),
      ).toEqual(lodashAssign({}, openState, { isOpen: false }));
    },
  );

  test('unknown action type should return current state [modal-reducer-default]', () => {
    expect(
      modalReducer(modalState, { type: 'UNKNOWN_ACTION' }),
    ).toEqual(modalState);
  });
});

describe('modalAboutReducer', () => {
  test('should return the initial state [modal-about-reducer-initial]', () => {
    expect(modalAboutReducer(undefined, {})).toEqual({ isOpen: false });
  });

  test(`${constants.OPEN_ABOUT} action type should set isOpen to true [modal-about-reducer-open]`, () => {
    expect(
      modalAboutReducer({ isOpen: false }, { type: constants.OPEN_ABOUT }),
    ).toEqual({ isOpen: true });
  });

  test(`${constants.CLOSE_ABOUT} action type should set isOpen to false [modal-about-reducer-close]`, () => {
    expect(
      modalAboutReducer({ isOpen: true }, { type: constants.CLOSE_ABOUT }),
    ).toEqual({ isOpen: false });
  });

  test('unknown action type should return current state [modal-about-reducer-default]', () => {
    const currentState = { isOpen: true };
    expect(
      modalAboutReducer(currentState, { type: 'UNKNOWN_ACTION' }),
    ).toEqual(currentState);
  });
});
