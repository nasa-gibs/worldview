/* eslint-disable react/prop-types */
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('reactstrap', () => ({
  Spinner: ({ color, size, style }) => (
    <div data-testid="spinner" data-color={color} data-size={size} style={style} />
  ),
}));

let mockIsMobile = false;
let mockIsLoading = false;
let mockIsKioskModeActive = false;

jest.mock('react-redux', () => ({
  useSelector: (selector) => selector({
    screenSize: { isMobileDevice: mockIsMobile },
    loading: { isLoading: mockIsLoading },
    ui: { isKioskModeActive: mockIsKioskModeActive },
  }),
}));

import LoadingIndicator from './loading-spinner';

const renderSpinner = () => render(<LoadingIndicator />);

describe('LoadingIndicator component', () => {
  beforeEach(() => {
    mockIsMobile = false;
    mockIsLoading = false;
    mockIsKioskModeActive = false;
  });

  describe('visibility', () => {
    it('does not render spinner when isLoading is false', () => {
      mockIsLoading = false;
      const { queryByTestId } = renderSpinner();
      expect(queryByTestId('spinner')).not.toBeInTheDocument();
    });

    it('renders spinner when isLoading is true and kiosk mode is off', () => {
      mockIsLoading = true;
      const { getByTestId } = renderSpinner();
      expect(getByTestId('spinner')).toBeInTheDocument();
    });

    it('does not render spinner when isLoading is true but kiosk mode is active', () => {
      mockIsLoading = true;
      mockIsKioskModeActive = true;
      const { queryByTestId } = renderSpinner();
      expect(queryByTestId('spinner')).not.toBeInTheDocument();
    });

    it('does not render when both isLoading and isKioskModeActive are false', () => {
      mockIsLoading = false;
      mockIsKioskModeActive = false;
      const { queryByTestId } = renderSpinner();
      expect(queryByTestId('spinner')).not.toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('positions spinner at left: 310 on desktop', () => {
      mockIsLoading = true;
      mockIsMobile = false;
      const { container } = renderSpinner();
      const wrapper = container.firstChild;
      expect(wrapper.style.left).toBe('310px');
    });

    it('positions spinner at left: 80 on mobile', () => {
      mockIsLoading = true;
      mockIsMobile = true;
      const { container } = renderSpinner();
      const wrapper = container.firstChild;
      expect(wrapper.style.left).toBe('80px');
    });

    it('positions spinner at top: 10 on desktop', () => {
      mockIsLoading = true;
      mockIsMobile = false;
      const { container } = renderSpinner();
      expect(container.firstChild.style.top).toBe('10px');
    });

    it('positions spinner at top: 10 on mobile', () => {
      mockIsLoading = true;
      mockIsMobile = true;
      const { container } = renderSpinner();
      expect(container.firstChild.style.top).toBe('10px');
    });

    it('uses high zIndex for overlay positioning', () => {
      mockIsLoading = true;
      const { container } = renderSpinner();
      expect(container.firstChild.style.zIndex).toBe('999');
    });

    it('renders Spinner with light color', () => {
      mockIsLoading = true;
      const { getByTestId } = renderSpinner();
      expect(getByTestId('spinner').dataset.color).toBe('light');
    });
  });
});
