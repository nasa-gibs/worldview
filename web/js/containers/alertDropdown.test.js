/* eslint-disable react/prop-types */

import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

let mockState;
jest.mock('react-redux', () => ({
  useSelector: (selector) => selector(mockState),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: (props) => <i data-testid="fa-icon" data-icon={String(props.icon)} />,
}));

jest.mock('../components/feature-alert/alert', () => () => <div data-testid="feature-alert" />);
jest.mock('./alerts', () => () => <div data-testid="alerts" />);

const AlertDropdown = require('./alertDropdown').default;

const makeState = (overrides = {}) => ({
  ui: { isDistractionFreeModeActive: false },
  screenSize: { isMobileDevice: false },
  ...overrides,
});

beforeEach(() => {
  mockState = makeState();
});

describe('AlertDropdown', () => {
  it('renders the dropdown wrapper visible by default', () => {
    const { container } = render(<AlertDropdown isTourActive={false} />);
    const wrapper = container.querySelector('.wv-alert-dropdown');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).not.toHaveAttribute('hidden');
  });

  it('hides the wrapper when distraction free mode is active', () => {
    mockState = makeState({ ui: { isDistractionFreeModeActive: true } });
    const { container } = render(<AlertDropdown isTourActive={false} />);
    expect(container.querySelector('.wv-alert-dropdown')).toHaveAttribute('hidden');
  });

  it('hides the wrapper when the tour is active', () => {
    const { container } = render(<AlertDropdown isTourActive />);
    expect(container.querySelector('.wv-alert-dropdown')).toHaveAttribute('hidden');
  });

  it('hides the wrapper on mobile devices', () => {
    mockState = makeState({ screenSize: { isMobileDevice: true } });
    const { container } = render(<AlertDropdown isTourActive={false} />);
    expect(container.querySelector('.wv-alert-dropdown')).toHaveAttribute('hidden');
  });

  it('renders FeatureAlert and Alerts inside the alert container', () => {
    const { getByTestId } = render(<AlertDropdown isTourActive={false} />);
    expect(getByTestId('feature-alert')).toBeInTheDocument();
    expect(getByTestId('alerts')).toBeInTheDocument();
  });

  it('toggles the dropdown open and closed via the button', () => {
    const { container } = render(<AlertDropdown isTourActive={false} />);
    const button = container.querySelector('button');
    expect(container.querySelector('.wv-alert-footer')).toHaveAttribute('hidden');
    fireEvent.click(button);
    // with two children in the container, footer shows when open
    expect(container.querySelector('.wv-alert-footer')).not.toHaveAttribute('hidden');
    fireEvent.click(button);
    expect(container.querySelector('.wv-alert-footer')).toHaveAttribute('hidden');
  });

  it('shows the alert container when the dropdown is open', () => {
    const { container } = render(<AlertDropdown isTourActive={false} />);
    const button = container.querySelector('button');
    expect(container.querySelector('#wv-alert-container')).toHaveAttribute('hidden');
    fireEvent.click(button);
    expect(container.querySelector('#wv-alert-container')).not.toHaveAttribute('hidden');
  });
});
