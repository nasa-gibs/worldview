
/**
 * @field - Property name to build this facet on
 * @label - Label text to show for this facet in the UI
 * @useLabelForValue - For boolean facets, use the @label instead of 'true' or 'false'
 * @filterType -
 * @tooltip - Tooltip text for thie facet
 * @view - A custom view renderer to use instead of the default
 * @hideZeroCount - Whether or not to hide filter results that zero matches
 */

export default [
  {
    field: 'coverage',
    label: 'Coverage',
    filterType: 'any',
    tooltip: 'Filter by coverage on the current selected date, or always available',
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
    field: 'layerPeriod',
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
  {
    field: 'dataCenter',
    label: 'DAAC/SIPS',
    filterType: 'any',
    tooltip: 'Distributed Active Archive Center / Science Investigator-led Processing System',
    show: 30,
    hideZeroCount: true,
  },
  {
    field: 'type',
    label: 'Imagery Type',
    filterType: 'any',
    tooltip: 'Granule-based rasters cover the spatial footprint of individual data files; mosaics assemble granules into spatially continuous maps. Vectors provide additional attribute information or flow visualizations.',
    hideZeroCount: true,
  },
  {
    field: 'analysis',
    label: 'Analysis',
    filterType: 'any',
    tooltip: 'Create time series charts or get statistics of a single variable',
    hideZeroCount: true,
  },
];
