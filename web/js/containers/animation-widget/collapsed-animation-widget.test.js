/* eslint-disable react/jsx-props-no-spreading */
/* eslint-disable react/prop-types */
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

jest.mock('react-draggable', () => {
  const capture = {};
  const MockDraggable = ({ children, ...props }) => {
    Object.assign(capture, props);
    return children;
  };
  MockDraggable.draggableCapture = capture;
  return { __esModule: true, default: MockDraggable };
});

jest.mock('../../components/animation-widget/play-button', () => {
  const capture = {};
  const MockPlayButton = (props) => {
    Object.assign(capture, props);
    return <button data-testid="play-button" />;
  };
  MockPlayButton.playButtonCapture = capture;
  return { __esModule: true, default: MockPlayButton };
});

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, onClick, className }) => (
    <svg data-testid={`fa-icon-${icon}`} className={className} onClick={onClick} />
  ),
}));

import CollapsedAnimationWidget from './collapsed-animation-widget';

let draggableCapture;
let playButtonCapture;

beforeAll(() => {
  const { default: MockDraggable } = jest.requireMock('react-draggable');
  draggableCapture = MockDraggable.draggableCapture;
  const { default: MockPlayButton } = jest.requireMock('../../components/animation-widget/play-button');
  playButtonCapture = MockPlayButton.playButtonCapture;
});

let defaultProps;

beforeEach(() => {
  defaultProps = {
    breakpoints: { small: 768 },
    collapsedWidgetPosition: { x: 10, y: 20 },
    handleDragStart: jest.fn(),
    hasSubdailyLayers: false,
    isDistractionFreeModeActive: false,
    isLandscape: false,
    isMobile: false,
    isMobilePhone: false,
    isMobileTablet: false,
    isPlaying: false,
    isPortrait: false,
    onClose: jest.fn(),
    onCollapsedDrag: jest.fn(),
    onPushPause: jest.fn(),
    onPushPlay: jest.fn(),
    playDisabled: false,
    screenWidth: 1024,
    toggleCollapse: jest.fn(),
  };
  Object.keys(draggableCapture).forEach((k) => delete draggableCapture[k]);
  Object.keys(playButtonCapture).forEach((k) => delete playButtonCapture[k]);
});

const renderWidget = (overrides = {}) => render(
  <CollapsedAnimationWidget {...defaultProps} {...overrides} />,
);

describe('CollapsedAnimationWidget visibility', () => {
  test('renders when isMobile is false and playDisabled is false', () => {
    renderWidget();
    expect(screen.getByTestId('play-button')).toBeInTheDocument();
  });

  test('renders when isMobile is true and playDisabled is false', () => {
    renderWidget({ isMobile: true, playDisabled: false });
    expect(screen.getByTestId('play-button')).toBeInTheDocument();
  });

  test('renders when isMobile is false and playDisabled is true', () => {
    renderWidget({ isMobile: false, playDisabled: true });
    expect(screen.getByTestId('play-button')).toBeInTheDocument();
  });

  test('renders nothing when isMobile and playDisabled are both true', () => {
    renderWidget({ isMobile: true, playDisabled: true });
    expect(screen.queryByTestId('play-button')).not.toBeInTheDocument();
  });
});

describe('CollapsedAnimationWidget CSS classes', () => {
  test('always includes base wrapper classes', () => {
    const { container } = renderWidget();
    const wrapper = container.querySelector('.wv-animation-widget-wrapper');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass('minimized');
  });

  test('adds subdaily class when hasSubdailyLayers is true', () => {
    const { container } = renderWidget({ hasSubdailyLayers: true });
    expect(container.querySelector('.wv-animation-widget-wrapper')).toHaveClass('subdaily');
  });

  test('does not add subdaily class when hasSubdailyLayers is false', () => {
    const { container } = renderWidget({ hasSubdailyLayers: false });
    expect(container.querySelector('.wv-animation-widget-wrapper')).not.toHaveClass('subdaily');
  });

  test('adds mobile class when isMobile is true', () => {
    const { container } = renderWidget({ isMobile: true });
    expect(container.querySelector('.wv-animation-widget-wrapper')).toHaveClass('mobile');
  });

  test('does not add mobile class when isMobile is false', () => {
    const { container } = renderWidget({ isMobile: false });
    expect(container.querySelector('.wv-animation-widget-wrapper')).not.toHaveClass('mobile');
  });

  test('adds landscape class when isLandscape is true', () => {
    const { container } = renderWidget({ isLandscape: true });
    expect(container.querySelector('.wv-animation-widget-wrapper')).toHaveClass('landscape');
  });

  test('does not add landscape class when isLandscape is false', () => {
    const { container } = renderWidget({ isLandscape: false });
    expect(container.querySelector('.wv-animation-widget-wrapper')).not.toHaveClass('landscape');
  });

  test('inner widget div has correct classes', () => {
    const { container } = renderWidget();
    const inner = container.querySelector('#wv-animation-widget');
    expect(inner).toHaveClass('wv-animation-widget', 'minimized');
  });
});

describe('CollapsedAnimationWidget getWidgetIDs — desktop default', () => {
  test('returns undefined for desktop (large screen, non-mobile)', () => {
    const { container } = renderWidget();
    expect(container.querySelector('[id^="collapsed-animate-widget"]').id).toBe('collapsed-animate-widgetundefined');
  });
});

describe('CollapsedAnimationWidget getWidgetIDs — distraction free', () => {
  test('returns phone-portrait-distraction-free when active, portrait, screenWidth < 670', () => {
    const { container } = renderWidget({
      isDistractionFreeModeActive: true,
      isPortrait: true,
      screenWidth: 600,
    });
    expect(container.querySelector('#collapsed-animate-widget-phone-portrait-distraction-free')).toBeInTheDocument();
  });

  test('does not return distraction-free id when screenWidth >= 670', () => {
    const { container } = renderWidget({
      isDistractionFreeModeActive: true,
      isPortrait: true,
      screenWidth: 670,
    });
    expect(container.querySelector('#collapsed-animate-widget-phone-portrait-distraction-free')).not.toBeInTheDocument();
  });
});

describe('CollapsedAnimationWidget getWidgetIDs — phone portrait', () => {
  test('returns phone-portrait when isMobilePhone and isPortrait', () => {
    const { container } = renderWidget({ isMobilePhone: true, isPortrait: true });
    expect(container.querySelector('#collapsed-animate-widget-phone-portrait')).toBeInTheDocument();
  });

  test('returns phone-portrait-subdaily when isMobilePhone, isPortrait, hasSubdailyLayers', () => {
    const { container } = renderWidget({
      isMobilePhone: true,
      isPortrait: true,
      hasSubdailyLayers: true,
    });
    expect(container.querySelector('#collapsed-animate-widget-phone-portrait-subdaily')).toBeInTheDocument();
  });

  test('returns phone-portrait-subdaily for narrow screen with subdaily layers and not tablet', () => {
    const { container } = renderWidget({
      isMobileTablet: false,
      screenWidth: 600,
      hasSubdailyLayers: true,
    });
    expect(container.querySelector('#collapsed-animate-widget-phone-portrait-subdaily')).toBeInTheDocument();
  });

  test('returns phone-portrait for very narrow screen without subdaily layers and not tablet', () => {
    const { container } = renderWidget({
      isMobileTablet: false,
      screenWidth: 500,
      hasSubdailyLayers: false,
    });
    expect(container.querySelector('#collapsed-animate-widget-phone-portrait')).toBeInTheDocument();
  });
});

describe('CollapsedAnimationWidget getWidgetIDs — phone landscape', () => {
  test('returns phone-landscape when isMobilePhone and isLandscape', () => {
    const { container } = renderWidget({ isMobilePhone: true, isLandscape: true });
    expect(container.querySelector('#collapsed-animate-widget-phone-landscape')).toBeInTheDocument();
  });

  test('returns phone-landscape-subdaily when isMobilePhone, isLandscape, hasSubdailyLayers', () => {
    const { container } = renderWidget({
      isMobilePhone: true,
      isLandscape: true,
      hasSubdailyLayers: true,
    });
    expect(container.querySelector('#collapsed-animate-widget-phone-landscape-subdaily')).toBeInTheDocument();
  });
});

describe('CollapsedAnimationWidget getWidgetIDs — tablet portrait', () => {
  test('returns tablet-portrait when isMobileTablet and isPortrait', () => {
    const { container } = renderWidget({ isMobileTablet: true, isPortrait: true });
    expect(container.querySelector('#collapsed-animate-widget-tablet-portrait')).toBeInTheDocument();
  });

  test('returns tablet-portrait-subdaily when isMobileTablet, isPortrait, hasSubdailyLayers', () => {
    const { container } = renderWidget({
      isMobileTablet: true,
      isPortrait: true,
      hasSubdailyLayers: true,
    });
    expect(container.querySelector('#collapsed-animate-widget-tablet-portrait-subdaily')).toBeInTheDocument();
  });

  test('returns tablet-portrait when not phone and screenWidth < breakpoints.small', () => {
    const { container } = renderWidget({
      isMobilePhone: false,
      screenWidth: 600,
      breakpoints: { small: 768 },
    });
    expect(container.querySelector('#collapsed-animate-widget-tablet-portrait')).toBeInTheDocument();
  });
});

describe('CollapsedAnimationWidget getWidgetIDs — tablet landscape', () => {
  test('returns tablet-landscape when isMobileTablet and isLandscape', () => {
    const { container } = renderWidget({ isMobileTablet: true, isLandscape: true });
    expect(container.querySelector('#collapsed-animate-widget-tablet-landscape')).toBeInTheDocument();
  });

  test('returns tablet-landscape-subdaily when isMobileTablet, isLandscape, hasSubdailyLayers', () => {
    const { container } = renderWidget({
      isMobileTablet: true,
      isLandscape: true,
      hasSubdailyLayers: true,
    });
    expect(container.querySelector('#collapsed-animate-widget-tablet-landscape-subdaily')).toBeInTheDocument();
  });
});

describe('CollapsedAnimationWidget Draggable props', () => {
  test('passes collapsedWidgetPosition as position', () => {
    const position = { x: 50, y: 100 };
    renderWidget({ collapsedWidgetPosition: position });
    expect(draggableCapture.position).toEqual(position);
  });

  test('passes handleDragStart as onStart', () => {
    renderWidget();
    expect(draggableCapture.onStart).toBe(defaultProps.handleDragStart);
  });

  test('passes onCollapsedDrag as onDrag', () => {
    renderWidget();
    expect(draggableCapture.onDrag).toBe(defaultProps.onCollapsedDrag);
  });

  test('passes isMobile as disabled', () => {
    renderWidget({ isMobile: true });
    expect(draggableCapture.disabled).toBe(true);
  });

  test('disabled is false when isMobile is false', () => {
    renderWidget({ isMobile: false });
    expect(draggableCapture.disabled).toBe(false);
  });

  test('passes "body" as bounds', () => {
    renderWidget();
    expect(draggableCapture.bounds).toBe('body');
  });

  test('passes ".no-drag, svg" as cancel', () => {
    renderWidget();
    expect(draggableCapture.cancel).toBe('.no-drag, svg');
  });
});

describe('CollapsedAnimationWidget PlayButton props', () => {
  test('passes isPlaying as playing', () => {
    renderWidget({ isPlaying: true });
    expect(playButtonCapture.playing).toBe(true);
  });

  test('passes onPushPlay as play', () => {
    renderWidget();
    expect(playButtonCapture.play).toBe(defaultProps.onPushPlay);
  });

  test('passes onPushPause as pause', () => {
    renderWidget();
    expect(playButtonCapture.pause).toBe(defaultProps.onPushPause);
  });

  test('passes playDisabled as isDisabled', () => {
    renderWidget({ playDisabled: true });
    expect(playButtonCapture.isDisabled).toBe(true);
  });

  test('passes isMobile as isMobile', () => {
    renderWidget({ isMobile: true });
    expect(playButtonCapture.isMobile).toBe(true);
  });
});

describe('CollapsedAnimationWidget icons', () => {
  test('shows chevron-up and times icons when not mobile', () => {
    renderWidget({ isMobile: false });
    expect(screen.getByTestId('fa-icon-chevron-up')).toBeInTheDocument();
    expect(screen.getByTestId('fa-icon-times')).toBeInTheDocument();
  });

  test('does not show icons when isMobile is true', () => {
    renderWidget({ isMobile: true });
    expect(screen.queryByTestId('fa-icon-chevron-up')).not.toBeInTheDocument();
    expect(screen.queryByTestId('fa-icon-times')).not.toBeInTheDocument();
  });

  test('chevron-up has wv-expand class', () => {
    renderWidget({ isMobile: false });
    expect(screen.getByTestId('fa-icon-chevron-up')).toHaveClass('wv-expand');
  });

  test('times icon has wv-close class', () => {
    renderWidget({ isMobile: false });
    expect(screen.getByTestId('fa-icon-times')).toHaveClass('wv-close');
  });

  test('clicking chevron-up calls toggleCollapse', () => {
    renderWidget({ isMobile: false });
    fireEvent.click(screen.getByTestId('fa-icon-chevron-up'));
    expect(defaultProps.toggleCollapse).toHaveBeenCalledTimes(1);
  });

  test('clicking times icon calls onClose', () => {
    renderWidget({ isMobile: false });
    fireEvent.click(screen.getByTestId('fa-icon-times'));
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });
});
