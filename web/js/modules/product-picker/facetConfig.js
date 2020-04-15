const facetConfig = [
  {
    field: 'categories',
    label: 'Category',
    tooltip: 'Layer categories',
    show: 20,
  },
  {
    field: 'measurements',
    label: 'Measurements',
    tooltip: 'Science measurements',
    show: 5,
    hideZeroCount: true,
  },
  {
    field: 'sources',
    label: 'Source',
    tooltip: 'Satellite and instrument the layer data is derived from',
    hideZeroCount: true,
  },
  {
    field: 'facetPeriod',
    label: 'Period',
    tooltip: 'Recurring time period that data is available for',
    hideZeroCount: true,
  },
  {
    field: 'active',
    label: 'Currently Active?',
    tooltip: 'Is this layer derived from a currently ongoing mission',
  },
  {
    field: 'track',
    label: 'Track Asc/Desc',
    tooltip: 'Hmmmmmm',
  },
  {
    field: 'daynight',
    label: 'Track Day/Night',
    tooltip: 'Coverage period for correesponding satellite\'s orbit track',
  },
  {
    field: 'processingLevelId',
    label: 'Processing Level',
    tooltip: 'Level of data processing',
    show: 15,
    hideZeroCount: true,
  },
];

export default facetConfig;
