/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import NavCase from './nav-case';

jest.mock('./nav-item', () => function MockNavItem({
  id, className, label, disabled, isDisabled, shouldHideInMobile, isMobile, onTabClick, text,
}) {
  return (
    <button
      type="button"
      data-testid={`nav-item-${id}`}
      data-classname={className}
      data-label={label}
      data-disabled={String(disabled)}
      data-is-disabled={String(isDisabled)}
      data-should-hide={String(shouldHideInMobile)}
      data-mobile={String(isMobile)}
      onClick={() => onTabClick(id)}
    >
      {text}
    </button>
  );
});

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({ icon, style }) => (
    <span data-testid="fa-icon" data-icon={icon} style={style} />
  ),
}));

jest.mock('reactstrap', () => ({
  Nav: ({ children }) => <div data-testid="nav">{children}</div>,
  UncontrolledTooltip: ({ children }) => <div data-testid="tooltip">{children}</div>,
}));

const defaultProps = {
  tabTypes: { download: true, events: true },
  isMobile: false,
  isCompareMode: false,
  isChartMode: false,
  isEventsTabDisabledEmbed: false,
  onTabClick: jest.fn(),
  activeTab: 'layers',
  isDataDisabled: false,
  toggleSidebar: jest.fn(),
};

function renderCase(overrides = {}) {
  return render(<NavCase {...defaultProps} {...overrides} />);
}

describe('NavCase', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('which tabs render', () => {
    it('always renders the Layers tab', () => {
      renderCase();
      expect(screen.getByTestId('nav-item-layers')).toBeInTheDocument();
    });

    it('renders the events tab when tabTypes.events is true', () => {
      renderCase();
      expect(screen.getByTestId('nav-item-events')).toBeInTheDocument();
    });

    it('does not render the events tab when tabTypes.events is false', () => {
      renderCase({ tabTypes: { download: true, events: false } });
      expect(screen.queryByTestId('nav-item-events')).toBeNull();
    });

    it('does not render the events tab when isEventsTabDisabledEmbed is true', () => {
      renderCase({ isEventsTabDisabledEmbed: true });
      expect(screen.queryByTestId('nav-item-events')).toBeNull();
    });

    it('renders the download tab when tabTypes.download is true', () => {
      renderCase();
      expect(screen.getByTestId('nav-item-download')).toBeInTheDocument();
    });

    it('does not render the download tab when tabTypes.download is false', () => {
      renderCase({ tabTypes: { download: false, events: true } });
      expect(screen.queryByTestId('nav-item-download')).toBeNull();
    });
  });

  describe('layers tab className', () => {
    it('is active when activeTab is layers', () => {
      renderCase({ activeTab: 'layers' });
      expect(screen.getByTestId('nav-item-layers')).toHaveAttribute('data-classname', 'sidebar-tab first-tab active');
    });

    it('is not active when another tab is active', () => {
      renderCase({ activeTab: 'events' });
      expect(screen.getByTestId('nav-item-layers')).toHaveAttribute('data-classname', 'sidebar-tab first-tab');
    });
  });

  describe('events tab', () => {
    it('is active when activeTab is events', () => {
      renderCase({ activeTab: 'events' });
      expect(screen.getByTestId('nav-item-events')).toHaveAttribute('data-classname', 'sidebar-tab second-tab active');
    });

    it('uses the default events label by default', () => {
      renderCase();
      expect(screen.getByTestId('nav-item-events')).toHaveAttribute('data-label', 'Natural Events');
    });

    it('uses the chart-mode label and disabled class when in chart mode', () => {
      renderCase({ isChartMode: true });
      const events = screen.getByTestId('nav-item-events');
      expect(events).toHaveAttribute('data-label', 'You must exit charting mode to use the natural events feature');
      expect(events).toHaveAttribute('data-classname', 'sidebar-tab second-tab disabled');
      expect(events).toHaveAttribute('data-disabled', 'true');
    });

    it('uses the compare-mode label and disabled class when in compare mode', () => {
      renderCase({ isCompareMode: true });
      const events = screen.getByTestId('nav-item-events');
      expect(events).toHaveAttribute('data-label', 'You must exit comparison mode to use the natural events feature');
      expect(events).toHaveAttribute('data-classname', 'sidebar-tab second-tab disabled');
      expect(events).toHaveAttribute('data-is-disabled', 'true');
    });
  });

  describe('download tab', () => {
    it('is active when activeTab is download', () => {
      renderCase({ activeTab: 'download' });
      expect(screen.getByTestId('nav-item-download')).toHaveAttribute('data-classname', 'sidebar-tab third-tab active');
    });

    it('uses the default data download label and class by default', () => {
      renderCase();
      const download = screen.getByTestId('nav-item-download');
      expect(download).toHaveAttribute('data-label', 'Data Download');
      expect(download).toHaveAttribute('data-classname', 'sidebar-tab third-tab');
      expect(download).toHaveAttribute('data-disabled', 'false');
    });

    it('uses the chart-mode label and disabled class when in chart mode', () => {
      renderCase({ activeTab: 'layers', isChartMode: true });
      const download = screen.getByTestId('nav-item-download');
      expect(download).toHaveAttribute('data-label', 'You must exit charting mode to download data');
      expect(download).toHaveAttribute('data-classname', 'sidebar-tab third-tab disabled');
      expect(download).toHaveAttribute('data-disabled', 'true');
    });

    it('uses the compare-mode label when in compare mode', () => {
      renderCase({ isCompareMode: true });
      const download = screen.getByTestId('nav-item-download');
      expect(download).toHaveAttribute('data-label', 'You must exit comparison mode to download data');
      expect(download).toHaveAttribute('data-disabled', 'true');
    });

    it('is disabled when data is disabled', () => {
      renderCase({ isDataDisabled: true });
      expect(screen.getByTestId('nav-item-download')).toHaveAttribute('data-is-disabled', 'true');
    });
  });

  describe('collapse button', () => {
    it('calls toggleSidebar when clicked', () => {
      const toggleSidebar = jest.fn();
      renderCase({ toggleSidebar });
      fireEvent.click(document.getElementById('toggleIconHolder'));
      expect(toggleSidebar).toHaveBeenCalled();
    });

    it('uses the caret-up icon on desktop', () => {
      renderCase({ isMobile: false });
      expect(screen.getByTestId('fa-icon')).toHaveAttribute('data-icon', 'caret-up');
    });

    it('uses the times icon on mobile', () => {
      renderCase({ isMobile: true });
      expect(screen.getByTestId('fa-icon')).toHaveAttribute('data-icon', 'times');
    });

    it('applies mobile sizing styles to the collapse button on mobile', () => {
      renderCase({ isMobile: true });
      expect(document.getElementById('toggleIconHolder')).toHaveStyle({ height: '48px', width: '45px' });
    });
  });

  describe('onTabClick wiring', () => {
    it('passes onTabClick through so a tab can fire it', () => {
      const onTabClick = jest.fn();
      renderCase({ onTabClick });
      fireEvent.click(screen.getByTestId('nav-item-layers'));
      expect(onTabClick).toHaveBeenCalledWith('layers');
    });
  });
});
