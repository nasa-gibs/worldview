/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, className, size }) => (
    <svg data-testid="font-awesome-icon" data-icon={icon} className={className} data-size={size} />
  ),
}));

jest.mock('reactstrap', () => ({
  UncontrolledTooltip: ({ children, target, placement }) => (
    <div data-testid="tooltip" data-target={target} data-placement={placement}>
      {children}
    </div>
  ),
}));

import AnimationButton from './animation-button';

const defaultProps = {
  disabled: false,
  label: 'Set up animation',
  clickAnimationButton: jest.fn(),
  breakpoints: { small: 768 },
  screenWidth: 1024,
  isKioskModeActive: false,
  isLandscape: false,
  isPortrait: false,
  isMobilePhone: false,
  isMobileTablet: false,
  isMobile: false,
  hasSubdailyLayers: false,
  isEmbedModeActive: false,
};

const renderButton = (props = {}) => render(<AnimationButton {...defaultProps} {...props} />);

describe('AnimationButton', () => {
  beforeEach(() => {
    defaultProps.clickAnimationButton.mockClear();
  });

  describe('rendering', () => {
    it('renders a button element', () => {
      const { getByRole } = renderButton();
      expect(getByRole('button')).toBeInTheDocument();
    });

    it('renders the FontAwesome video icon', () => {
      const { getByTestId } = renderButton();
      expect(getByTestId('font-awesome-icon')).toBeInTheDocument();
      expect(getByTestId('font-awesome-icon').dataset.icon).toBe('video');
    });

    it('uses provided label as aria-label', () => {
      const { getByRole } = renderButton({ label: 'Custom Label' });
      expect(getByRole('button')).toHaveAttribute('aria-label', 'Custom Label');
    });

    it('falls back to default aria-label when label is not provided', () => {
      const { getByRole } = renderButton({ label: undefined });
      expect(getByRole('button')).toHaveAttribute('aria-label', 'Set up animation');
    });

    it('shows tooltip on desktop (non-mobile)', () => {
      const { getByTestId } = renderButton({ isMobile: false });
      expect(getByTestId('tooltip')).toBeInTheDocument();
    });

    it('does not show tooltip on mobile', () => {
      const { queryByTestId } = renderButton({
        isMobile: true,
        isMobilePhone: true,
        isPortrait: true,
      });
      expect(queryByTestId('tooltip')).not.toBeInTheDocument();
    });

    it('tooltip targets animate-button id', () => {
      const { getByTestId } = renderButton({ isMobile: false });
      expect(getByTestId('tooltip').dataset.target).toBe('animate-button');
    });

    it('tooltip uses top placement', () => {
      const { getByTestId } = renderButton({ isMobile: false });
      expect(getByTestId('tooltip').dataset.placement).toBe('top');
    });

    it('tooltip displays label text', () => {
      const { getByTestId } = renderButton({ label: 'My Animation' });
      expect(getByTestId('tooltip').textContent).toBe('My Animation');
    });
  });

  describe('click behavior', () => {
    it('calls clickAnimationButton when button is clicked', () => {
      const clickMock = jest.fn();
      const { getByRole } = renderButton({ clickAnimationButton: clickMock });
      fireEvent.click(getByRole('button'));
      expect(clickMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('className — kiosk mode', () => {
    it('sets d-none when isKioskModeActive is true', () => {
      const { getByRole } = renderButton({ isKioskModeActive: true });
      expect(getByRole('button')).toHaveClass('d-none');
    });
  });

  describe('className — disabled', () => {
    it('sets disabled class when disabled is true and kiosk mode is off', () => {
      const { getByRole } = renderButton({ disabled: true });
      expect(getByRole('button')).toHaveClass('wv-disabled-button', 'button-action-group', 'animate-button');
    });
  });

  describe('className — desktop non-embed', () => {
    it('uses standard animate-button class on desktop', () => {
      const { getByRole } = renderButton({ isMobile: false, isEmbedModeActive: false });
      expect(getByRole('button')).toHaveClass('button-action-group', 'animate-button');
      expect(getByRole('button')).not.toHaveClass('mobile-animate-button');
    });
  });

  describe('className — mobile fallback (embed or mobile)', () => {
    it('uses mobile-animate-button class when isMobile and no specific breakpoint class', () => {
      const { getByRole } = renderButton({
        isMobile: true,
        isMobileTablet: true,
        isLandscape: true,
        hasSubdailyLayers: false,
      });
      const btn = getByRole('button');
      expect(btn).toHaveClass('button-action-group', 'mobile-animate-button');
    });
  });

  describe('getButtonClassName — phone portrait', () => {
    it('returns phone-portrait for isMobilePhone + isPortrait', () => {
      const { getByRole } = renderButton({
        isMobile: true,
        isMobilePhone: true,
        isPortrait: true,
        isEmbedModeActive: false,
      });
      expect(getByRole('button').className).toContain('animate-button-phone-portrait');
    });

    it('returns phone-portrait-subdaily for isMobilePhone + isPortrait + hasSubdailyLayers', () => {
      const { getByRole } = renderButton({
        isMobile: true,
        isMobilePhone: true,
        isPortrait: true,
        hasSubdailyLayers: true,
        isEmbedModeActive: false,
      });
      expect(getByRole('button').className).toContain('animate-button-phone-portrait-subdaily');
    });

    it('returns phone-portrait-embed for isMobilePhone + isPortrait + isEmbedModeActive', () => {
      const { getByRole } = renderButton({
        isMobile: true,
        isMobilePhone: true,
        isPortrait: true,
        isEmbedModeActive: true,
      });
      expect(getByRole('button').className).toContain('animate-button-phone-portrait-embed');
    });

    it('returns phone-portrait for non-tablet narrowWidth + hasSubdailyLayers + screenWidth < 670', () => {
      const { getByRole } = renderButton({
        isMobile: true,
        isMobilePhone: false,
        isMobileTablet: false,
        screenWidth: 600,
        hasSubdailyLayers: true,
        isEmbedModeActive: false,
      });
      expect(getByRole('button').className).toContain('animate-button-phone-portrait-subdaily');
    });

    it('returns phone-portrait for non-tablet + screenWidth < 575 + no subdaily layers', () => {
      const { getByRole } = renderButton({
        isMobile: true,
        isMobilePhone: false,
        isMobileTablet: false,
        screenWidth: 500,
        hasSubdailyLayers: false,
        isEmbedModeActive: false,
      });
      expect(getByRole('button').className).toContain('animate-button-phone-portrait');
    });

    it('returns embed for non-tablet + screenWidth < 575 + embed mode', () => {
      const { getByRole } = renderButton({
        isMobile: true,
        isMobilePhone: false,
        isMobileTablet: false,
        screenWidth: 500,
        hasSubdailyLayers: false,
        isEmbedModeActive: true,
      });
      expect(getByRole('button').className).toContain('animate-button-phone-portrait-embed');
    });
  });

  describe('getButtonClassName — phone landscape', () => {
    it('returns phone-landscape for isMobilePhone + isLandscape', () => {
      const { getByRole } = renderButton({
        isMobile: true,
        isMobilePhone: true,
        isLandscape: true,
        isPortrait: false,
        isEmbedModeActive: false,
      });
      expect(getByRole('button').className).toContain('animate-button-phone-landscape');
    });

    it('returns phone-landscape-subdaily for isMobilePhone + isLandscape + hasSubdailyLayers', () => {
      const { getByRole } = renderButton({
        isMobile: true,
        isMobilePhone: true,
        isLandscape: true,
        isPortrait: false,
        hasSubdailyLayers: true,
        isEmbedModeActive: false,
      });
      expect(getByRole('button').className).toContain('animate-button-phone-landscape-subdaily');
    });
  });

  describe('getButtonClassName — tablet portrait', () => {
    it('returns tablet-portrait for isMobileTablet + isPortrait', () => {
      const { getByRole } = renderButton({
        isMobile: true,
        isMobileTablet: true,
        isPortrait: true,
        isMobilePhone: false,
        isEmbedModeActive: false,
      });
      expect(getByRole('button').className).toContain('animate-button-tablet-portrait');
    });

    it('returns tablet-portrait-subdaily for isMobileTablet + isPortrait + hasSubdailyLayers', () => {
      const { getByRole } = renderButton({
        isMobile: true,
        isMobileTablet: true,
        isPortrait: true,
        isMobilePhone: false,
        hasSubdailyLayers: true,
        isEmbedModeActive: false,
      });
      expect(getByRole('button').className).toContain('animate-button-tablet-portrait-subdaily');
    });

    it('returns tablet-portrait-embed for isMobileTablet + isPortrait + isEmbedModeActive', () => {
      const { getByRole } = renderButton({
        isMobile: true,
        isMobileTablet: true,
        isPortrait: true,
        isMobilePhone: false,
        isEmbedModeActive: true,
      });
      expect(getByRole('button').className).toContain('animate-button-tablet-portrait-embed');
    });

    it('returns tablet-portrait when 575 < screenWidth < breakpoints.small for non-phone non-tablet', () => {
      const { getByRole } = renderButton({
        isMobile: true,
        isMobilePhone: false,
        isMobileTablet: false,
        screenWidth: 650,
        breakpoints: { small: 768 },
        hasSubdailyLayers: false,
        isEmbedModeActive: false,
      });
      expect(getByRole('button').className).toContain('animate-button-tablet-portrait');
    });

    it('returns tablet-portrait-embed for non-mobile + embed mode (embed forces tablet-portrait)', () => {
      const { getByRole } = renderButton({
        isMobile: false,
        isMobilePhone: false,
        isMobileTablet: false,
        screenWidth: 1024,
        breakpoints: { small: 768 },
        isEmbedModeActive: true,
      });
      expect(getByRole('button').className).toContain('animate-button-tablet-portrait-embed');
    });
  });

  describe('getButtonClassName — tablet landscape', () => {
    it('returns tablet-landscape for isMobileTablet + isLandscape', () => {
      const { getByRole } = renderButton({
        isMobile: true,
        isMobileTablet: true,
        isLandscape: true,
        isPortrait: false,
        isMobilePhone: false,
        isEmbedModeActive: false,
      });
      expect(getByRole('button').className).toContain('animate-button-tablet-landscape');
    });

    it('returns tablet-landscape-subdaily for isMobileTablet + isLandscape + hasSubdailyLayers', () => {
      const { getByRole } = renderButton({
        isMobile: true,
        isMobileTablet: true,
        isLandscape: true,
        isPortrait: false,
        isMobilePhone: false,
        hasSubdailyLayers: true,
        isEmbedModeActive: false,
      });
      expect(getByRole('button').className).toContain('animate-button-tablet-landscape-subdaily');
    });
  });

  describe('getButtonClassName — returns undefined (desktop non-embed)', () => {
    it('does not append a buttonClass suffix for desktop non-embed', () => {
      const { getByRole } = renderButton({
        isMobile: false,
        isEmbedModeActive: false,
        screenWidth: 1200,
        breakpoints: { small: 768 },
      });
      const btn = getByRole('button');
      expect(btn).toHaveClass('button-action-group', 'animate-button');
      expect(btn.className).not.toContain('undefined');
    });
  });
});
