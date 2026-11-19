/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import {
  render, fireEvent, act, waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';

let capturedMapState;
let capturedMapDispatch;
jest.mock('react-redux', () => ({
  connect: (mapState, mapDispatch) => {
    capturedMapState = mapState;
    capturedMapDispatch = mapDispatch;
    return (Component) => Component;
  },
}));

jest.mock('copy-to-clipboard', () => ({
  __esModule: true,
  default: jest.fn(() => Promise.resolve()),
}));

jest.mock('googleTagManager', () => ({
  __esModule: true,
  default: { pushEvent: jest.fn() },
}));

jest.mock('../components/toolbar/share/tooltips', () => () => <div data-testid="share-tooltips" />);
jest.mock('../components/util/hover-tooltip', () => () => <span data-testid="hover-tooltip" />);

let mockCheckboxProps = null;
jest.mock('../components/util/checkbox', () => (props) => {
  mockCheckboxProps = props;
  return <div data-testid="shorten-checkbox" data-checked={props.checked} />;
});

jest.mock('../modules/link/util', () => ({
  getPermalink: jest.fn((qs, date, isEmbed) => `permalink:${qs}:${isEmbed ? 'embed' : 'std'}`),
  wrapWithIframe: jest.fn((url) => `<iframe src="${url}"></iframe>`),
}));

jest.mock('../modules/feedback/util', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../modules/feedback/actions', () => ({
  __esModule: true,
  default: jest.fn(() => ({ type: 'INIT_FEEDBACK' })),
}));

jest.mock('../modules/date/selectors', () => ({
  getSelectedDate: jest.fn(() => new Date('2021-01-01T00:00:00Z')),
}));

jest.mock('../modules/link/actions', () => ({
  requestShortLink: jest.fn((location, type, signal, options) => ({
    type: 'REQUEST_SHORT_LINK', location, contentType: type, options,
  })),
}));

const mockUnlisten = jest.fn();
const mockHistory = {
  location: { search: '?p=geographic' },
  listen: jest.fn(() => mockUnlisten),
};
jest.mock('../main', () => ({
  __esModule: true,
  default: mockHistory,
}));

const ShareLinkContainer = require('./share').default;
const copy = require('copy-to-clipboard').default;
const googleTagManager = require('googleTagManager').default;
const { getPermalink, wrapWithIframe } = require('../modules/link/util');
const onClickFeedback = require('../modules/feedback/util').default;
const initFeedback = require('../modules/feedback/actions').default;
const { requestShortLink } = require('../modules/link/actions');

const defaultProps = {
  embedDisableNavLink: false,
  feedbackIsInitiated: false,
  feedbackEnabled: true,
  isMobile: false,
  mock: '',
  requestShortLinkAction: jest.fn(() => Promise.resolve()),
  selectedDate: new Date('2021-01-01T00:00:00Z'),
  sendFeedback: jest.fn(),
  shortLink: { isLoading: false, response: false, error: false },
  urlShortening: true,
};

const renderComponent = (props = {}) => render(
  <ShareLinkContainer {...defaultProps} {...props} />,
);

beforeEach(() => {
  jest.clearAllMocks();
  mockCheckboxProps = null;
  mockHistory.location = { search: '?p=geographic' };
});

describe('ShareLinkContainer tabs', () => {
  it('renders three tabs on desktop', () => {
    const { container } = renderComponent();
    const navLinks = container.querySelectorAll('.nav-link');
    expect(navLinks).toHaveLength(3);
    expect(navLinks[0].textContent).toBe('Link');
    expect(navLinks[1].textContent).toBe('Embed');
    expect(navLinks[2].textContent).toBe('Cite Us');
  });

  it('renders only link and cite-us tabs on mobile', () => {
    const { container } = renderComponent({ isMobile: true });
    const navLinks = container.querySelectorAll('.nav-link');
    expect(navLinks).toHaveLength(2);
  });

  it('disables the embed tab with a tooltip when embedDisableNavLink is set', () => {
    const { container, getAllByTestId } = renderComponent({ embedDisableNavLink: true });
    const embedLink = container.querySelector('.embed-share-nav .nav-link');
    expect(embedLink.classList.contains('disabled')).toBe(true);
    expect(getAllByTestId('hover-tooltip').length).toBeGreaterThan(0);
  });

  it('switches to the embed tab and renders iframe code', () => {
    const { container } = renderComponent();
    fireEvent.click(container.querySelectorAll('.nav-link')[1]);
    expect(wrapWithIframe).toHaveBeenCalledWith('permalink:?p=geographic:embed');
    const input = container.querySelector('#permalink-content-embed');
    expect(input.value).toContain('<iframe');
    expect(container.querySelector('.share-body').classList.contains('tall')).toBe(true);
  });

  it('switches to cite-us tab and renders the citation textarea', () => {
    const { container } = renderComponent();
    fireEvent.click(container.querySelectorAll('.nav-link')[2]);
    const textarea = container.querySelector('textarea#permalink-content-cite-us');
    expect(textarea.value).toContain('NASA Worldview application');
  });
});

describe('link tab behavior', () => {
  it('shows the permalink in the input', () => {
    const { container } = renderComponent();
    expect(container.querySelector('#permalink-content-link').value)
      .toBe('permalink:?p=geographic:std');
  });

  it('copies the link to the clipboard and records the event', async () => {
    const { container } = renderComponent();
    fireEvent.click(container.querySelector('#copy-to-clipboard-button-link'));
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({
      event: 'share_link_copy',
      link_type: 'link',
    });
    expect(copy).toHaveBeenCalledWith('permalink:?p=geographic:std', { format: 'text/plain' });
    await act(async () => {});
  });

  it('shortens the link via the checkbox and shows the short link', async () => {
    const requestShortLinkAction = jest.fn(() => Promise.resolve());
    const { container } = renderComponent({
      requestShortLinkAction,
      shortLink: { isLoading: false, response: { link: 'https://go.nasa.gov/x' }, error: false },
    });
    await act(async () => {
      mockCheckboxProps.onCheck();
    });
    expect(requestShortLinkAction).toHaveBeenCalledWith('mock/short_link.json');
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({ event: 'share_link_shorten' });
    expect(container.querySelector('#permalink-content-link').value).toBe('https://go.nasa.gov/x');
    // unchecking flips back without re-requesting
    await act(async () => {
      mockCheckboxProps.onCheck();
    });
    expect(requestShortLinkAction).toHaveBeenCalledTimes(1);
    expect(container.querySelector('#permalink-content-link').value)
      .toBe('permalink:?p=geographic:std');
  });

  it('shows "Please wait..." while the short link is loading', async () => {
    const { container } = renderComponent({
      shortLink: { isLoading: true, response: false, error: false },
    });
    await act(async () => {
      mockCheckboxProps.onCheck();
    });
    expect(container.querySelector('#permalink-content-link').value).toBe('Please wait...');
  });

  it('resets isShort when the short link request errors', async () => {
    const { container, rerender } = renderComponent({
      shortLink: { isLoading: false, response: { link: 'short' }, error: false },
    });
    await act(async () => {
      mockCheckboxProps.onCheck();
    });
    expect(container.querySelector('#permalink-content-link').value).toBe('short');
    act(() => {
      rerender(
        <ShareLinkContainer
          {...defaultProps}
          shortLink={{ isLoading: false, response: false, error: true }}
        />,
      );
    });
    expect(container.querySelector('#permalink-content-link').value)
      .toBe('permalink:?p=geographic:std');
  });
});

describe('history listener', () => {
  it('updates the query string when history location changes', async () => {
    const { container } = renderComponent();
    expect(mockHistory.listen).toHaveBeenCalled();
    const listener = mockHistory.listen.mock.calls[0][0];
    mockHistory.location = { search: '?p=arctic' };
    act(() => {
      listener({ search: '?p=arctic' }, 'PUSH');
    });
    await waitFor(() => {
      expect(container.querySelector('#permalink-content-link').value)
        .toBe('permalink:?p=arctic:std');
    });
  });

  it('ignores listener updates with undefined search', () => {
    const { container } = renderComponent();
    const listener = mockHistory.listen.mock.calls[0][0];
    act(() => {
      listener({ search: undefined }, 'PUSH');
    });
    expect(container.querySelector('#permalink-content-link').value)
      .toBe('permalink:?p=geographic:std');
  });

  it('unsubscribes from history on unmount', () => {
    const { unmount } = renderComponent();
    unmount();
    expect(mockUnlisten).toHaveBeenCalled();
  });
});

describe('embed tab feedback link', () => {
  it('opens feedback on click when feedback is enabled', () => {
    const sendFeedback = jest.fn();
    const { container } = renderComponent({ sendFeedback });
    fireEvent.click(container.querySelectorAll('.nav-link')[1]);
    fireEvent.click(container.querySelector('#feedback-url'));
    expect(sendFeedback).toHaveBeenCalledWith(false, false);
  });

  it('does not open feedback when feedback is disabled', () => {
    const sendFeedback = jest.fn();
    const { container } = renderComponent({ sendFeedback, feedbackEnabled: false });
    fireEvent.click(container.querySelectorAll('.nav-link')[1]);
    fireEvent.click(container.querySelector('#feedback-url'));
    expect(sendFeedback).not.toHaveBeenCalled();
  });

  it('opens feedback via Enter key', () => {
    const sendFeedback = jest.fn();
    const { container } = renderComponent({ sendFeedback });
    fireEvent.click(container.querySelectorAll('.nav-link')[1]);
    fireEvent.keyDown(container.querySelector('#feedback-url'), { key: 'Enter' });
    expect(sendFeedback).toHaveBeenCalled();
  });

  it('ignores other keys', () => {
    const sendFeedback = jest.fn();
    const { container } = renderComponent({ sendFeedback });
    fireEvent.click(container.querySelectorAll('.nav-link')[1]);
    fireEvent.keyDown(container.querySelector('#feedback-url'), { key: 'a' });
    expect(sendFeedback).not.toHaveBeenCalled();
  });
});

describe('mapStateToProps', () => {
  const makeState = (overrides = {}) => ({
    screenSize: { isMobileDevice: false },
    config: {
      features: { urlShortening: true, feedback: true },
      parameters: {},
    },
    shortLink: { isLoading: false },
    sidebar: { activeTab: 'layers' },
    tour: { active: false },
    feedback: { isInitiated: true },
    ...overrides,
  });

  it('maps share state', () => {
    const result = capturedMapState(makeState());
    expect(result.urlShortening).toBe(true);
    expect(result.feedbackEnabled).toBe(true);
    expect(result.feedbackIsInitiated).toBe(true);
    expect(result.embedDisableNavLink).toBe(false);
    expect(result.mock).toBe('');
  });

  it('disables embed nav when the download tab is active', () => {
    const result = capturedMapState(makeState({ sidebar: { activeTab: 'download' } }));
    expect(result.embedDisableNavLink).toBe(true);
  });

  it('disables embed nav when the tour is active', () => {
    const result = capturedMapState(makeState({ tour: { active: true } }));
    expect(result.embedDisableNavLink).toBe(true);
  });

  it('passes the shorten mock parameter when configured', () => {
    const result = capturedMapState(makeState({
      config: {
        features: { urlShortening: false, feedback: false },
        parameters: { shorten: 'mock-param' },
      },
    }));
    expect(result.mock).toBe('mock-param');
  });
});

describe('mapDispatchToProps', () => {
  let dispatch;
  let props;
  beforeEach(() => {
    dispatch = jest.fn();
    props = capturedMapDispatch(dispatch);
  });

  it('requestShortLinkAction dispatches requestShortLink', () => {
    props.requestShortLinkAction('some/location', { opt: 1 });
    expect(requestShortLink).toHaveBeenCalledWith('some/location', 'application/json', null, { opt: 1 });
    expect(dispatch).toHaveBeenCalled();
  });

  it('sendFeedback initiates feedback when needed', () => {
    props.sendFeedback(false, false);
    expect(onClickFeedback).toHaveBeenCalledWith(false, false);
    expect(initFeedback).toHaveBeenCalled();
  });

  it('sendFeedback skips init when already initiated', () => {
    props.sendFeedback(true, true);
    expect(dispatch).not.toHaveBeenCalled();
  });
});

describe('getPermalink usage', () => {
  it('builds permalink from current query string and selected date', () => {
    renderComponent();
    expect(getPermalink).toHaveBeenCalledWith('?p=geographic', defaultProps.selectedDate, undefined);
  });
});
