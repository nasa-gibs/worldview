/* eslint-disable react/prop-types */
import { render, fireEvent } from '@testing-library/react';
import ProductFacet from './product-facet';

jest.mock('@elastic/react-search-ui', () => ({
  Facet: ({ field, label }) => (
    <div data-testid="facet" data-field={field} data-label={label} />
  ),
}));

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: ({
    icon, className, onClick, id,
  }) => (
    <span
      data-testid={`fa-${icon}`}
      className={className}
      id={id}
      onClick={onClick}
    />
  ),
}));

jest.mock('reactstrap', () => ({
  Tooltip: ({ children, isOpen, toggle }) => (
    <div data-testid="tooltip" data-open={String(isOpen)} onClick={toggle}>
      {children}
    </div>
  ),
}));

const baseConfig = {
  field: 'categories',
  label: 'Categories',
  booleanOptionLabel: '',
  filterType: 'any',
  tooltip: '<b>Category info</b>',
  show: 10,
  view: undefined,
};

const defaultData = [{ value: 'Fires', count: 5 }];

const renderFacet = ({
  config = baseConfig,
  data = defaultData,
  collapsed = false,
  toggleCollapse = jest.fn(),
} = {}) => render(
  <ProductFacet
    config={config}
    data={data}
    collapsed={collapsed}
    toggleCollapse={toggleCollapse}
  />,
);

describe('ProductFacet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('collapsed=true branch', () => {
    it('renders the collapsed branch with fieldset and no Facet component', () => {
      const { getByText, queryByTestId } = renderFacet({ collapsed: true });
      expect(getByText('Categories')).toBeTruthy();
      expect(queryByTestId('facet')).toBeNull();
    });

    it('renders the correct wrapper id when collapsed', () => {
      const { container } = renderFacet({ collapsed: true });
      expect(container.querySelector('#categories-facet')).toBeTruthy();
    });

    it('does not render "No matches." when collapsed with non-empty data', () => {
      const { queryByText } = renderFacet({ collapsed: true });
      expect(queryByText('No matches.')).toBeNull();
    });

    it('does not render "No matches." when collapsed with empty data', () => {
      const { queryByText } = renderFacet({ collapsed: true, data: [] });
      expect(queryByText('No matches.')).toBeNull();
    });
  });

  describe('noResults branch (data=[], collapsed=false)', () => {
    it('renders "No matches." when data is empty and not collapsed', () => {
      const { getByText } = renderFacet({ data: [] });
      expect(getByText('No matches.')).toBeTruthy();
    });

    it('renders fieldset label when no results and not collapsed', () => {
      const { getByText } = renderFacet({ data: [] });
      expect(getByText('Categories')).toBeTruthy();
    });

    it('does not render Facet component when no results', () => {
      const { queryByTestId } = renderFacet({ data: [] });
      expect(queryByTestId('facet')).toBeNull();
    });

    it('renders wrapper with correct id', () => {
      const { container } = renderFacet({ data: [] });
      expect(container.querySelector('#categories-facet')).toBeTruthy();
    });
  });

  describe('normal branch (data non-empty, collapsed=false)', () => {
    it('renders the Facet component', () => {
      const { getByTestId } = renderFacet();
      expect(getByTestId('facet')).toBeTruthy();
    });

    it('passes field to Facet', () => {
      const { getByTestId } = renderFacet();
      expect(getByTestId('facet').dataset.field).toBe('categories');
    });

    it('uses label when booleanOptionLabel is empty string', () => {
      const config = {
        ...baseConfig,
        booleanOptionLabel: '',
      };
      const { getByTestId } = renderFacet({ config });
      expect(getByTestId('facet').dataset.label).toBe('Categories');
    });

    it('uses booleanOptionLabel when present', () => {
      const config = {
        ...baseConfig,
        booleanOptionLabel: 'Boolean Label',
      };
      const { getByTestId } = renderFacet({ config });
      expect(getByTestId('facet').dataset.label).toBe('Boolean Label');
    });

    it('does not render fieldset in normal branch', () => {
      const { container } = renderFacet();
      expect(container.querySelector('fieldset')).toBeNull();
    });

    it('does not render "No matches." in normal branch', () => {
      const { queryByText } = renderFacet();
      expect(queryByText('No matches.')).toBeNull();
    });

    it('renders wrapper with correct id', () => {
      const { container } = renderFacet();
      expect(container.querySelector('#categories-facet')).toBeTruthy();
    });
  });

  describe('collapse icon behavior', () => {
    it('renders caret-down icon when not collapsed', () => {
      const { getByTestId } = renderFacet({ collapsed: false });
      expect(getByTestId('fa-caret-down')).toBeTruthy();
    });

    it('renders caret-left icon when collapsed', () => {
      const { getByTestId } = renderFacet({ collapsed: true });
      expect(getByTestId('fa-caret-left')).toBeTruthy();
    });

    it('calls toggleCollapse with field when caret-down is clicked', () => {
      const toggleCollapse = jest.fn();
      const { getByTestId } = renderFacet({ collapsed: false, toggleCollapse });
      fireEvent.click(getByTestId('fa-caret-down'));
      expect(toggleCollapse).toHaveBeenCalledWith('categories');
    });

    it('calls toggleCollapse with field when caret-left is clicked (collapsed state)', () => {
      const toggleCollapse = jest.fn();
      const { getByTestId } = renderFacet({ collapsed: true, toggleCollapse });
      fireEvent.click(getByTestId('fa-caret-left'));
      expect(toggleCollapse).toHaveBeenCalledWith('categories');
    });
  });

  describe('collapse toggle icon hidden class', () => {
    it('adds "hidden" class to collapse icon when data is empty', () => {
      const { getByTestId } = renderFacet({ data: [] });
      expect(getByTestId('fa-caret-down').className).toContain('hidden');
    });

    it('does not add "hidden" class to collapse icon when data is non-empty', () => {
      const { getByTestId } = renderFacet();
      expect(getByTestId('fa-caret-down').className).not.toContain('hidden');
    });
  });

  describe('tooltip behavior', () => {
    it('renders tooltip with isOpen=false initially', () => {
      const { getByTestId } = renderFacet();
      expect(getByTestId('tooltip').dataset.open).toBe('false');
    });

    it('toggles tooltip open when clicked', () => {
      const { getByTestId } = renderFacet();
      const tooltip = getByTestId('tooltip');
      fireEvent.click(tooltip);
      expect(tooltip.dataset.open).toBe('true');
    });

    it('toggles tooltip closed on second click', () => {
      const { getByTestId } = renderFacet();
      const tooltip = getByTestId('tooltip');
      fireEvent.click(tooltip);
      fireEvent.click(tooltip);
      expect(tooltip.dataset.open).toBe('false');
    });

    it('renders info-circle icon with correct id for tooltip target', () => {
      const { getByTestId } = renderFacet();
      expect(getByTestId('fa-info-circle').id).toBe('categories-tooltip-target');
    });

    it('renders tooltip in collapsed state', () => {
      const { getByTestId } = renderFacet({ collapsed: true });
      expect(getByTestId('tooltip').dataset.open).toBe('false');
    });
  });

  describe('header icons always rendered', () => {
    it('renders tooltip and both icons in collapsed state', () => {
      const { getByTestId } = renderFacet({ collapsed: true });
      expect(getByTestId('tooltip')).toBeTruthy();
      expect(getByTestId('fa-info-circle')).toBeTruthy();
      expect(getByTestId('fa-caret-left')).toBeTruthy();
    });

    it('renders tooltip and both icons in normal state', () => {
      const { getByTestId } = renderFacet();
      expect(getByTestId('tooltip')).toBeTruthy();
      expect(getByTestId('fa-info-circle')).toBeTruthy();
      expect(getByTestId('fa-caret-down')).toBeTruthy();
    });

    it('renders tooltip and both icons in no-results state', () => {
      const { getByTestId } = renderFacet({ data: [] });
      expect(getByTestId('tooltip')).toBeTruthy();
      expect(getByTestId('fa-info-circle')).toBeTruthy();
      expect(getByTestId('fa-caret-down')).toBeTruthy();
    });
  });
});
