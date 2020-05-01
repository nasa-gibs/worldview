import {
  BooleanFacet,
} from '@elastic/react-search-ui-views';

export default [
  {
    field: 'availableAtDate',
    label: 'Available',
    filterType: 'any',
    tooltip: 'Layer has available imagery at currently selected date/time',
    view: BooleanFacet,
    useLabelForValue: true,
  },
  {
    field: 'categories',
    label: 'Category',
    filterType: 'any',
    tooltip: 'Hazards and Disasters, Science Disciplines and Featured Categories',
    show: 20,
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
    field: 'track',
    label: 'Track Asc/Desc',
    filterType: 'any',
    tooltip: 'Whether the satellite orbit track passes over on the ascending or descending node',
  },
  {
    field: 'daynight',
    label: 'Track Day/Night',
    filterType: 'any',
    tooltip: 'Whether the satellite orbit track passes over during the daytime or nighttime',
  },
  {
    field: 'processingLevelId',
    label: 'Processing Level',
    filterType: 'any',
    tooltip: 'Level of data processing. For more information see: https://earthdata.nasa.gov/collaborate/open-data-services-and-software/data-information-policy/data-levels',
    show: 15,
    hideZeroCount: true,
  },
];
