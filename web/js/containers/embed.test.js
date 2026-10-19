/* eslint-disable react/prop-types */

import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

let capturedMapState;
jest.mock('react-redux', () => ({
  connect: (mapState, mapDispatch) => {
    capturedMapState = mapState;
    return (Component) => Component;
  },
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: (props) => <i data-icon={String(props.icon)} />,
}));

jest.mock('googleTagManager', () => ({
  __esModule: true,
  default: { pushEvent: jest.fn() },
}));

jest.mock('../modules/link/util', () => ({
  getPermalink: jest.fn(() => 'https://example.com/permalink'),
}));

jest.mock('../modules/date/selectors', () => ({
  getSelectedDate: jest.fn(() => new Date('2021-01-01T00:00:00Z')),
}));

jest.mock('../components/util/hover-tooltip', () => () => <span data-testid="tooltip" />);

jest.mock('../main', () => ({
  __esModule: true,
  default: { location: { search: '?p=geographic' } },
}));

const Embed = require('./embed').default;
const googleTagManager = require('googleTagManager').default;
const { getPermalink } = require('../modules/link/util');
const { getSelectedDate } = require('../modules/date/selectors');

const selectedDate = new Date('2021-01-01T00:00:00Z');

beforeEach(() => {
  jest.clearAllMocks();
  getPermalink.mockReturnValue('https://example.com/permalink');
});

describe('Embed component', () => {
  it('renders nothing when embed mode is not active', () => {
    const { container } = render(
      <Embed isEmbedModeActive={false} selectedDate={selectedDate} isMobile={false} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the embed wrapper and link button when active', () => {
    const { container } = render(
      <Embed isEmbedModeActive selectedDate={selectedDate} isMobile={false} />,
    );
    expect(container.querySelector('#embed-mode-wrapper')).toBeInTheDocument();
    expect(container.querySelector('#wv-embed-link-button')).toBeInTheDocument();
  });

  it('opens the permalink in a new tab on button click', () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => {});
    const { container } = render(
      <Embed isEmbedModeActive selectedDate={selectedDate} isMobile={false} />,
    );
    fireEvent.click(container.querySelector('#wv-embed-link-button'));
    expect(getPermalink).toHaveBeenCalledWith('?p=geographic', selectedDate);
    expect(googleTagManager.pushEvent).toHaveBeenCalledWith({ event: 'embed_open_new_tab' });
    expect(openSpy).toHaveBeenCalledWith('https://example.com/permalink', '_blank');
    openSpy.mockRestore();
  });

  it('shows the click-to-interact overlay on mouse enter and hides it on leave', () => {
    const { container } = render(
      <Embed isEmbedModeActive selectedDate={selectedDate} isMobile={false} />,
    );
    const wrapper = container.querySelector('#embed-mode-wrapper');
    fireEvent.mouseEnter(wrapper);
    expect(container.querySelector('.embed-overlay-bg')).toBeInTheDocument();
    fireEvent.mouseLeave(wrapper);
    expect(container.querySelector('.embed-overlay-bg')).toBeNull();
  });

  it('removes the overlay permanently after clicking it', () => {
    const { container } = render(
      <Embed isEmbedModeActive selectedDate={selectedDate} isMobile={false} />,
    );
    const wrapper = container.querySelector('#embed-mode-wrapper');
    fireEvent.mouseEnter(wrapper);
    fireEvent.click(container.querySelector('.embed-overlay-bg'));
    expect(container.querySelector('.embed-overlay-bg')).toBeNull();
    // wrapper id removed after click
    expect(container.querySelector('#embed-mode-wrapper')).toBeNull();
  });
});

describe('mapStateToProps', () => {
  it('maps embed and screenSize state', () => {
    const state = {
      screenSize: { isMobileDevice: true },
      embed: { isEmbedModeActive: true },
    };
    const result = capturedMapState(state);
    expect(result.isEmbedModeActive).toBe(true);
    expect(result.isMobile).toBe(true);
    expect(getSelectedDate).toHaveBeenCalledWith(state);
    expect(result.selectedDate).toEqual(selectedDate);
  });
});
