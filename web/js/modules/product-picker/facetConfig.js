const facetConfig = [
  {
    field: 'categories',
    label: 'Category',
    tooltip: 'Hazards and Disasters, Science Disciplines and Featured Categories',
    show: 20,
  },
  {
    field: 'measurements',
    label: 'Measurements',
    tooltip: 'Scientific Measurements',
    show: 5,
    hideZeroCount: true,
  },
  {
    field: 'sources',
    label: 'Source',
    tooltip: 'Satellite and sensor/instrument',
    hideZeroCount: true,
  },
  {
    field: 'facetPeriod',
    label: 'Period',
    tooltip: 'Temporal Resolution',
    hideZeroCount: true,
  },
  {
    field: 'active',
    label: 'Currently Active?',
    tooltip: 'Is this layer derived from a currently ongoing mission?',
  },
  {
    field: 'track',
    label: 'Track Asc/Desc',
    tooltip: 'Whether the satellite orbit track passes over on the ascending or descending node',
  },
  {
    field: 'daynight',
    label: 'Track Day/Night',
    tooltip: 'Whether the satellite orbit track passes over during the daytime or nighttime',
  },
  {
    field: 'processingLevelId',
    label: 'Processing Level',
    tooltip: 'Level of data processing.  <a href="https://earthdata.nasa.gov/collaborate/open-data-services-and-software/data-information-policy/data-levels" target="_blank"> Read more. </a> ',
    show: 15,
    hideZeroCount: true,
  },
];

export default facetConfig;
