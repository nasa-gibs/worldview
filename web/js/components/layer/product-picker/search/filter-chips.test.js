import { render, fireEvent } from '@testing-library/react';
import FilterChips from './filter-chips';

jest.mock('@fortawesome/react-fontawesome', () => ({
  FontAwesomeIcon: () => <svg data-testid="fa-icon" />,
}));

const baseFacetConfig = [
  { field: 'categories', label: 'Category', filterType: 'any' },
  { field: 'sources', label: 'Source', filterType: 'any' },
  { field: 'coverage', label: 'Coverage', filterType: 'any', useLabelForValue: true },
];

const renderChips = (overrides = {}) => {
  const props = {
    filters: [],
    removeFilter: jest.fn(),
    facetConfig: baseFacetConfig,
    ...overrides,
  };
  return render(
    <FilterChips
      filters={props.filters}
      removeFilter={props.removeFilter}
      facetConfig={props.facetConfig}
    />,
  );
};

describe('FilterChips', () => {
  describe('empty / no filters', () => {
    it('renders null when filters array is empty', () => {
      const { container } = renderChips({ filters: [] });
      expect(container.firstChild).toBeNull();
    });
  });

  describe('rendering chips', () => {
    it('renders a chip for each filter value', () => {
      const filters = [{ field: 'categories', values: ['Fires', 'Floods'] }];
      const { getAllByRole } = renderChips({ filters });
      expect(getAllByRole('button')).toHaveLength(2);
    });

    it('renders chips for multiple filter fields', () => {
      const filters = [
        { field: 'categories', values: ['Fires'] },
        { field: 'sources', values: ['MODIS', 'VIIRS'] },
      ];
      const { getAllByRole } = renderChips({ filters });
      expect(getAllByRole('button')).toHaveLength(3);
    });

    it('wraps chips in a div with class bag-o-chips', () => {
      const filters = [{ field: 'categories', values: ['Fires'] }];
      const { container } = renderChips({ filters });
      expect(container.firstChild.className).toBe('bag-o-chips');
    });

    it('renders each chip with class filter-chip', () => {
      const filters = [{ field: 'categories', values: ['Fires'] }];
      const { getByRole } = renderChips({ filters });
      expect(getByRole('button').className).toBe('filter-chip');
    });

    it('displays the filter value as the chip label', () => {
      const filters = [{ field: 'categories', values: ['Fires'] }];
      const { getByRole } = renderChips({ filters });
      expect(getByRole('button').querySelector('span').innerHTML).toBe('Fires');
    });

    it('renders a FontAwesomeIcon icon inside each chip', () => {
      const filters = [{ field: 'categories', values: ['Fires'] }];
      const { getAllByTestId } = renderChips({ filters });
      expect(getAllByTestId('fa-icon')).toHaveLength(1);
    });
  });

  describe('useLabelForValue', () => {
    it('uses the config label as displayValue when useLabelForValue is true', () => {
      const filters = [{ field: 'coverage', values: ['true'] }];
      const { getByRole } = renderChips({ filters });
      expect(getByRole('button').querySelector('span').innerHTML).toBe('Coverage');
    });

    it('uses the raw value as displayValue when useLabelForValue is falsy', () => {
      const filters = [{ field: 'categories', values: ['Fires'] }];
      const { getByRole } = renderChips({ filters });
      expect(getByRole('button').querySelector('span').innerHTML).toBe('Fires');
    });
  });

  describe('removeFilter callback', () => {
    it('calls removeFilter with field and value when a chip is clicked', () => {
      const removeFilter = jest.fn();
      const filters = [{ field: 'categories', values: ['Fires'] }];
      const { getByRole } = renderChips({ filters, removeFilter });
      fireEvent.click(getByRole('button'));
      expect(removeFilter).toHaveBeenCalledWith('categories', 'Fires');
    });

    it('calls removeFilter with the correct value for each chip', () => {
      const removeFilter = jest.fn();
      const filters = [{ field: 'categories', values: ['Fires', 'Floods'] }];
      const { getAllByRole } = renderChips({ filters, removeFilter });
      fireEvent.click(getAllByRole('button')[1]);
      expect(removeFilter).toHaveBeenCalledWith('categories', 'Floods');
    });

    it('calls removeFilter with the correct field when multiple fields are active', () => {
      const removeFilter = jest.fn();
      const filters = [
        { field: 'categories', values: ['Fires'] },
        { field: 'sources', values: ['MODIS'] },
      ];
      const { getAllByRole } = renderChips({ filters, removeFilter });
      fireEvent.click(getAllByRole('button')[1]);
      expect(removeFilter).toHaveBeenCalledWith('sources', 'MODIS');
    });
  });
});
