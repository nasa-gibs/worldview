/* eslint-disable react/prop-types */
/* eslint-disable react/jsx-props-no-spreading */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import CustomNavItem from './nav-item';

jest.mock('reactstrap', () => ({
  NavItem: ({ children, style }) => (
    <div data-testid="nav-item" style={style}>{children}</div>
  ),
  NavLink: ({
    children, disabled, className, id, onClick, ...rest
  }) => (
    <button
      type="button"
      data-testid="nav-link"
      disabled={disabled}
      className={className}
      id={id}
      onClick={onClick}
      aria-label={rest['aria-label']}
    >
      {children}
    </button>
  ),
}));

jest.mock('../../util/hover-tooltip', () => function MockHoverTooltip({
  isMobile, labelText, target, placement,
}) {
  return (
    <div
      data-testid="hover-tooltip"
      data-mobile={String(isMobile)}
      data-label={labelText}
      data-target={target}
      data-placement={placement}
    />
  );
});

const defaultProps = {
  isMobile: false,
  shouldHideInMobile: false,
  isDisabled: false,
  label: 'Map Layers',
  className: 'sidebar-tab first-tab',
  onTabClick: jest.fn(),
  id: 'layers',
  iconClassName: 'icon-layers',
  text: 'Layers',
};

function renderItem(overrides = {}) {
  return render(<CustomNavItem {...defaultProps} {...overrides} />);
}

describe('CustomNavItem', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders the text and icon', () => {
    const { container } = renderItem();
    expect(screen.getByText('Layers')).toBeInTheDocument();
    expect(container.querySelector('i')).toHaveClass('productsIcon', 'selected', 'icon-layers');
  });

  it('applies the provided className and aria-label to the NavLink', () => {
    renderItem();
    const link = screen.getByTestId('nav-link');
    expect(link).toHaveClass('sidebar-tab', 'first-tab');
    expect(link).toHaveAttribute('aria-label', 'Map Layers');
  });

  it('builds the tab id from the id prop', () => {
    renderItem();
    expect(screen.getByTestId('nav-link')).toHaveAttribute('id', 'layers-sidebar-tab');
  });

  it('passes disabled through to the NavLink', () => {
    renderItem({ isDisabled: true });
    expect(screen.getByTestId('nav-link')).toBeDisabled();
  });

  it('is enabled when isDisabled is false', () => {
    renderItem({ isDisabled: false });
    expect(screen.getByTestId('nav-link')).not.toBeDisabled();
  });

  it('calls onTabClick with the id when clicked', () => {
    const onTabClick = jest.fn();
    renderItem({ onTabClick });
    fireEvent.click(screen.getByTestId('nav-link'));
    expect(onTabClick).toHaveBeenCalledWith('layers');
  });

  it('hides the item when shouldHideInMobile and isMobile are both true', () => {
    renderItem({ shouldHideInMobile: true, isMobile: true });
    expect(screen.getByTestId('nav-item')).toHaveStyle({ display: 'none' });
  });

  it('shows the item when shouldHideInMobile is true but isMobile is false', () => {
    renderItem({ shouldHideInMobile: true, isMobile: false });
    expect(screen.getByTestId('nav-item')).toHaveStyle({ display: 'block' });
  });

  it('shows the item when isMobile is true but shouldHideInMobile is false', () => {
    renderItem({ shouldHideInMobile: false, isMobile: true });
    expect(screen.getByTestId('nav-item')).toHaveStyle({ display: 'block' });
  });

  it('passes the expected props to the HoverTooltip', () => {
    renderItem({ isMobile: true });
    const tooltip = screen.getByTestId('hover-tooltip');
    expect(tooltip).toHaveAttribute('data-mobile', 'true');
    expect(tooltip).toHaveAttribute('data-label', 'Map Layers');
    expect(tooltip).toHaveAttribute('data-target', 'layers-sidebar-tab');
    expect(tooltip).toHaveAttribute('data-placement', 'top');
  });
});
