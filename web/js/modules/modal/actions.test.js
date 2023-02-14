import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import fetchMock from 'fetch-mock';
import { TextEncoder, TextDecoder } from 'util';
import {
  openBasicContent,
  openCustomContent,
  renderTemplate,
  requestTemplate,
  onToggle,
} from './actions';
import * as constants from './constants';
import util from '../../util/util';

// jsdom polyfills
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);
const ERROR_MESSAGE = 'There was an error';

describe('Modal open actions', () => {
  test(
    `openBasicContent action returns ${
      constants.OPEN_BASIC
    }header text, body text and encode key`,
    () => {
      const expectedAction = {
        type: constants.OPEN_BASIC,
        headerText: constants.TEST_HEADER,
        bodyText: constants.TEST_BODY,
        key: util.encodeId(`__BASIC_MODAL__${constants.TEST_HEADER}`),
      };
      expect(
        openBasicContent(constants.TEST_HEADER, constants.TEST_BODY),
      ).toEqual(expectedAction);
    },
  );

  test(`onToggle action returns ${constants.TOGGLE}as type`, () => {
    const expectedAction = {
      type: constants.TOGGLE,
    };
    expect(onToggle()).toEqual(expectedAction);
  });

  test(
    `openCustomContent action returns ${
      constants.OPEN_CUSTOM
    } action type`,
    () => {
      const customsKey = 'CUSTOM_MODAL_KEY';
      const customsParams = {
        offsetRight: '70px',
        headerText: constants.TEST_HEADER,
        modalClassName:
          'toolbar-snapshot-modal toolbar-modal toolbar-medium-modal',
      };
      const expectedAction = {
        type: constants.OPEN_CUSTOM,
        key: customsKey,
        customProps: customsParams,
      };
      expect(openCustomContent(customsKey, customsParams)).toEqual(
        expectedAction,
      );
    },
  );

  test(
    `renderTemplate action returns ${constants.RENDER_TEMPLATE} type, `,
    () => {
      const templateModalKey = 'somePageName';

      const expectedAction = {
        type: constants.RENDER_TEMPLATE,
        key: util.encodeId(templateModalKey),
        template: templateModalKey,
        headerText: constants.TEST_HEADER,
      };
      expect(renderTemplate(constants.TEST_HEADER, templateModalKey)).toEqual(
        expectedAction,
      );
    },
  );
});
describe('Template fetching', () => {
  afterEach(() => {
    fetchMock.restore();
  });
  test('triggers start and success action types', () => {
    const loc = 'mock/';
    fetchMock.getOnce(loc, {
      body: constants.ABOUT_MOCK_RESPONSE,
      headers: {
        'content-type': 'text/html',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
    const expectedActions = [
      { type: constants.TEMPLATE_REQUEST_START },
      {
        type: constants.TEMPLATE_REQUEST_SUCCESS,
        response: constants.ABOUT_MOCK_RESPONSE,
      },
    ];
    const store = mockStore({ modal: {} });
    return store
      .dispatch(requestTemplate(constants.TEMPLATE_REQUEST, loc, 'text/html'))
      .then(() => {
        expect(store.getActions()).toEqual(expectedActions);
      });
  });
  test(`creates ${constants.TEMPLATE_REQUEST_FAILURE} Action`, () => {
    const loc = 'mock/';
    fetchMock.mock(loc, {
      throws: ERROR_MESSAGE,
    });
    const expectedActions = [
      { type: constants.TEMPLATE_REQUEST_START },
      {
        type: constants.TEMPLATE_REQUEST_FAILURE,
        error: ERROR_MESSAGE,
      },
    ];
    const store = mockStore({ modal: {} });
    return store
      .dispatch(requestTemplate(constants.TEMPLATE_REQUEST, loc, 'text/html'))
      .catch(() => {
        expect(store.getActions()).toEqual(expectedActions);
      });
  });
});
