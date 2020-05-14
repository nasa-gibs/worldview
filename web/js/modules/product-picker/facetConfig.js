import AvailableFacet from '../../components/layer/product-picker/search/available-facet';

export default [
  {
    field: 'availableAtDate',
    label: 'Visible',
    filterType: 'any',
    tooltip: 'Layer has available imagery at currently selected date/time',
    view: AvailableFacet,
    useLabelForValue: true,
    hideZeroCount: true,
  },
  {
    field: 'categories',
    label: 'Category',
    filterType: 'any',
    tooltip: 'Hazards and Disasters, Science Disciplines and Featured Categories',
    show: 20,
    hideZeroCount: true,
  },
  {
    field: 'measurements',
    label: 'Measurements',
    filterType: 'any',
    tooltip: 'Scientific Measurements',
    show: 5,
    hideZeroCount: true,
  },
  {
    field: 'sources',
    label: 'Source',
    filterType: 'any',
    tooltip: 'Satellite and sensor/instrument',
    hideZeroCount: true,
  },
  {
    field: 'facetPeriod',
    label: 'Period',
    filterType: 'any',
    tooltip: 'Temporal Resolution',
    hideZeroCount: true,
  },
  {
    field: 'daynight',
    label: 'Day/Night',
    filterType: 'any',
    tooltip: 'Whether the layer represents daytime or nighttime imagery or data',
    hideZeroCount: true,
  },
];
