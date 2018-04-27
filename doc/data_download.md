# Data Download

**Note**: This feature uses the Common Metadata Repository (CMR) and does not
work for data sets stored elsewhere.

Each layer in Worldview can be mapped to a data product in the CMR. In the layer
configuration, use the *product* attribute and provide the identifier for the
downloadable product.

Each *product* is defined in the *products* section, keyed by identifier:

```json
{
  "products": {
    "MYD04_L2": {
      "name": "MODIS/Aqua Aerosol 5-Min L2 Swath 10km",
      "handler": "AquaSwathMultiDay",
      "query": {
        "shortName": "MYD04_L2"
      },
      "nrt": {
        "by": "value",
        "field": "data_center",
        "value": "LANCEMODIS"
      },
      "urs": {
        "by": "value",
        "field": "data_center",
        "value": "LANCEMODIS"
      }
    }
  }
}
```

## Handlers

Each product is assigned a handler that filters and processes the results
from the CMR. The following handlers are available:

* `AquaSwathMultiDay`: Use for Aqua 5-minute data granules where today,
yesterday, and tomorrow appear together on the same map.
* `CollectionList`: Does not display any information on the map and presents a
list. Use this for collections that do not have granules and only have
a collection level entry.
* `CollectionMix`: Handles layers which only have collection-level metadata
and have different collections based on the selected date. Uses
"science" and "nrt" query flags to distinguish between "old" and "new"
collections, respectively.
* `DailyAMSRE`: Displays a single entry for a daily AMSR-E product. Since the
metadata is too exact, this omits granules that happen to contain a small
fraction of the day.
* `DailyGranuleList`: Similar to `List` but also obtains granules three hours
from yesterday and tomorrow. This handler is only used for MODIS Combined
Value Added AOD and granules appear to be in six hour chunks. It isn't apparent
why this handler was necessary.
* `HalfOrbit`: Handles large granules that are broken up into an ascending
and descending component.
* `List`: Displays all granules for the given day listed in a dialog box and
not displayed on the map.
* `MODISGrid`: Maps MODIS H and V tiles to the sinusoidal grid.
* `MODISMix`: Handles layers where near-real time data is blocked into five
minute granules and where processed data is blocked into H and V sinusoidal
grid tiles.
* `MODISSwath`: Use for 5-minute data granules where only today is shown
on the map.
* `TerraSwathMultiDay`: Use for Terra 5-minute data granules where today,
yesterday, and tomorrow appear together on the same map.
* `WELDGranuleFootprints`: Use for the WELD product.

## Query Parameters

The `query` configuration specifies the parameters sent in the CMR query.
The available options are:

* `shortName`: Short name used to identify this product. If more than one
short name is required, for example, `AIRIBRAD` and `AIRIBRAD_NRT`, a list
can be provided.
* `dataCenterId`: Deprecated. Data center that provides this product. If more than
one data center is required, for example, `NSIDC_ECS` and `LANCEMODIS`, a list
can be provided. This parameter was used to speed up queries but now has the
opposite effect and can break certain queries.
* `dayNightFlag`: The value of the day/night flag, usually either `DAY` or
`NIGHT`. Note that a granule that is both day and night is set to `BOTH`
which isn't currently handled. Some products may populate this field with
`UNSPECIFIED`
* `collection`: Set to `true` when using the `CollectionList` handler for
when no granules exist.

If two queries need to be executed to obtain NRT and non-NRT products when
using the `MODISMix` handler, the query is specified in the following manner:

```json
"query": {
  "science": {
    "shortName": "MYD09GA",
    "dataCenterId": "LPDAAC_ECS"
  },
  "nrt": {
    "shortName": "MYD09",
    "dataCenterId": "LANCEMODIS"
  }
}
```

## Result Processing and Filtering

Each handler has a series of processors that change or filter each result.
The result processors and configurations are as follows:

### AntiMeridianMulti

If a granule splits the anti-meridian, this processor creates two polygons,
one on each side of the map. The constructor takes a `maxDistance` argument
that specifies a distance, in degrees. If a line segment in the polygon is
greater than `maxDistance`, it's assumed to be crossing the anti-meridian.

### CollectPreferred

If multiple granules exist for a given acquisition time, this attempts to
group the granule as either near-real time or science quality. The granule
should already be tagged for NRT before using this processor. One of the
granules will be marked as preferred as indicated by the `prefer` variable
in the data download model. Use `PreferredFilter` to select only one of these.

### CollectVersions

If multiple granules exist for a given acquisition time, this attempts to
group the granule by its version string. Use `VersionFilter` to select
only one of these.

### ConnectSwaths

Uses the acquisition times to create connector lines to show the swath
ground track. Swaths are normally connected when the start time of one
granule matches the end time of another granule. If this is not the
case, use the `delta` parameter to specify, in seconds, how much time should
be added to the start time to match the end time of another granule. For
VIIRS, this is -60.

### DateTimeLabel

Creates a label for this granule based on its acquisition date and time.

### Densify

Not used at the moment.

### DividePolygon

For polygons that cross the anti-meridian, normalize and create a mutli-polygon
with a polygon on each side. Uses code provided by the Earthdata Search client.

### ExtentFilter

Excludes granules that do not intersect the `extent` provided in the
constructor.

### GeometryFromCMR

Converts a CMR geometry to an OpenLayers 3 geometry.

### GeometryFromMODISGrid

Creates a polygon footprint given a MODIS H and V tile number.

### MODISGridIndex

Creates a index value by combining the MODIS H and V tile numbers.

### MODISGridLabel

Creates a label for this granule based on the MODIS H and V tile numbers.

### OfflineFilter

Filters out granules that are not available for download.

### OrbitFilter

Filter by ascending or descending orbit. Configure with `orbit` with the
following parameters:

* `type`: Always `regex_group`
* `field`: The field to inspect to find the orbit
* `regex`: The regular expression to match against, should have one group.
* `match`: Keep the granule if it matches this value.

Example:

```json
"orbit": {
  "type": "regex_group",
  "field": "producer_granule_id",
  "regex": ".*([AD])\\.hdf$",
  "match": "A"
}
```

### PreferredFilter

Only keeps near-real time granules if the `prefer` value passed in is `nrt`,
otherwise keeps science-quality granules if `science`.

### ProductLabel

Sets the label of the granule to the `name` provided in the constructor.

### TagButtonScale

Sets a scale value for the granule selection buttons. Useful for making the
buttons smaller for dense datasets. For example, WELD uses a value of
0.35.

### TagList

Forces the results to display in a dialog box list instead of on the map.

### TagNRT

Mark granules as near-real time depending on the following `nrt` configuration
parameters:

* `by`: Determine if this is NRT by `value` or `regex`
* `field`: The field value to check against
* `value`: Field value must equal this exactly.
* `regex`: Field value must match this regular expression.
* `handler`: If the handler for this product is `MODISMix` or `CollectionMix`,
the handler to use for the NRT query, for example, `TerraSwathMultiDay`.

Example:

```json
"nrt": {
  "handler": "TerraSwathMultiDay",
  "by": "value",
  "field": "data_center",
  "value": "LANCEMODIS"
},
```

### TagProduct

Add a field to the granule result with the name of the product.

### TagURS

Mark granules as requiring URS access depending on the following `urs`
configuration parameters.

* `by`: Determine if this requires URS by `value`, `regex`, or `constant`
* `field`: The field value to check against
* `value`: Field value must equal this exactly or the constant to set as.
* `regex`: Field value must match this regular expression.

### TagVersion

Parse out the version field into a numeric value that can used for comparison
operations.

### TimeFilter

Keep granules that meet the following values passed into the `spec`
constructor:

* `eastZone`: Minutes since UTC midnight to check for granules from the
previous day
* `westZone`: Minutes since UTC midnight to check for granules from the next
day.
* `maxDistance`: Any line segment in a polygon that exceeds this distance,
in degrees, is considered to have crossed the anti-meridian.

### TimeLabel

Creates a label for this granule based on its acquisition time only. Times
that are not from the selected day are indicated with + or - day indicators.

### TitleLabel

Use the provided title in the metadata as the granule label.

### Transform

Convert the EPSG:4326 coordinates into the other projections required for
display.

### VersionFilter

Given a set of granules with different versions, only select the latest.

### VersionFilterExact

Only select granules with the exact version specified in the `version`
configuration item.
