# Configuration

## Table of Contents

* [Overview](configuration.md)
* [Adding New Layers](layers.md)
  * [Vector Layers](vectors.md)
  * [Adding Layers to Layer Picker](product_picker.md)
* [Adding New Tour Stories](tour_stories.md)

---

## Adding New Layers

Create a new JSON document in [`config/default/common/config/wv.json/layers`](../../config/default/common/config/wv.json/layers) named `X.json` where `X` is the layer identifier used in the WMTS or WMS API call. This file can be placed in any subdirectory as needed for organizational purposes.

Here's an example of a minimum configuration for the Aerosol Optical Depth layer:

```json
{
  "layers": {
    "MODIS_Aqua_Aerosol": {
      "id": "MODIS_Aqua_Aerosol",
      "group": "overlays"
    }
  }
}
```

All properties should be in an object keyed by the layer identifier used in the WMTS of WMS API call.

## Layer Order

The [`layerOrder.json`](../../config/default/common/config/wv.json/layerOrder.json) file must be updated to include the new layer identifier. This file determines the order that layers are displayed in the add layers tab.

### Layer Order Example

[`config/default/common/config/wv.json/layerOrder.json`](../../config/default/common/config/wv.json/layerOrder.json)

```json
{
  "layerOrder": [
    "VIIRS_SNPP_CorrectedReflectance_TrueColor",
    "VIIRS_SNPP_CorrectedReflectance_BandsM3-I3-M11",
    "VIIRS_SNPP_CorrectedReflectance_BandsM11-I2-I1",
    ...
  ]
}
```

## Required Properties

NOTE: **title** and **subtitle** are only required if the values are not present in the [GIBS layer metadata](https://gibs.earthdata.nasa.gov/layer-metadata/v1.0/) (e.g. this is a non-GIBS layer).

* **id**: The layer identifier used in the WMTS or WMS call
* **title**: Title of the layer displayed to the end user. This is the first line displayed in the active layers list.
* **subtitle**: Subtitle of the layer displayed to the end user. This is the second line displayed in the active layers list and usually includes platform, sensor, and/or attribution information.
* **group**: The group this layer is found in, either `baselayers` or `overlays`
* **layergroup**: A string representing the group that this layer belongs to when shown in the sidebar. `Orbital Track` can used as a special identifier here to indicate layers which are orbit tracks.

The following properties are required ONLY if this information is not available via the GIBS WMTS GetCapabilities document:

* **type**: Tile service type, either `wmts`, `wms`, or `vector`.
* **format**: Image format type, either `image/png` or `image/jpeg`.
* **period**: Only required for WMS layers.  Use `subdaily`, `daily`, `monthly`, or `yearly` for layers that have new content and no startDate defined in GetCapabilities. Changing the period will affect how often the layer is requested in the timeline. Omit this parameter to always have the layer shown on the timeline.
* **startDate**: The first day that data is available, represented in YYYY-MM-DD or YYYY-MM-DDThh:mm:ssZ format.
* **endDate**: The last day that data is available, represented in YYYY-MM-DD or YYYY-MM-DDThh:mm:ssZ format.
* **ongoing**: Use `false` if the layer is no longer being produced.
* **futureTime**: Use `[number][type="D,M,Y"]` (i.e. "3D") to denote a layer that has a dynamic, future end date. The `[number]` parameter represents the dateInterval, `[type]` can be equal to `"D"`, `"M"`, or `"Y"` to represent day, month or year interval.

The following is only required if not provided by the WMTS GetCapabilities:

* **projections**: An object which contains an object for each projection supported by this layer. Projection information is keyed by the projection identifier (found in [`config/default/common/config/wv.json/projections`](../../config/default/common/config/wv.json/projections)).
  * **source**: Identifier that indicates which endpoint contains this layer (see [`sources.json`](../../config/default/release/config/wv.json/sources.json))
  * **matrixSet**: For WMTS layers only, the name of the matrix set as defined in the endpoint's GetCapabilities document.

Example:

```json
"projections": {
  "antarctic": {
    "source": "GIBS:antarctic",
    "matrixSet": "EPSG3031_250m"
  },
  "arctic": {
    "source": "GIBS:arctic",
    "matrixSet": "EPSG3413_250m"
  }
}
```

## Optional Properties

* **tags**: Additional text used for matching this layer when searching in the add layers tab. This allows Aerosol Optical Depth layers to match when "aod" is typed in.
* **noTransition**: For WMTS layers only, if set to `true`, the map will not display lower-resolution tiles while loading.
* **transition**: For WMS layers only, if set to `true`, the map will display lower-resolution tiles while loading.
* **track**: Classify a layer's track direction. This will usually be either ascending or descending and will be displayed within the title of the layer in the Measurement / Sources add modal view if provided.
* **description**: Point to a markdown file within the metadata folder to provide a layer description.
* **disableSnapshot**: Disable Worldview Snapshots (WVS) for layer.
* **disableSmartHandoff**: Disable data download capability for a layer.
* **wrapadjacentdays**: Wrap the layer across the anti-meridian but select the previous day when greater than 180 and the next day when less than -180.
* **wrapX**: Wrap the layer across the anti-meridian.
* **palette**: To display a color palette legend, a `palette` object should exist with the following properties:
  * **id**: Identifier of the palette. This should match the name of the colormap file without the extension.
  * **recommended**: Array of custom palette identifiers that are recommended for use with this layer (see [`config/default/common/config/palettes-custom.json`](../../config/default/common/config/palettes-custom.json)). Example, *["orange_1", "red_1"]*
  * **immutable**(optional): When this flag is set to true, the options to adjust thresholds and colormaps are removed.
* **availability**: Used to denote datetime availability info that cannot be gleaned from the capabilities document. Primarily for our geostationary layers which only have historical coverage going back ~90 days. Represented as an object with the following properties:
  * **rollingWindow**: Number of days, counting backwards from app load time, that a layer has available coverage.  Setting this will cause a layer's `startDate` property to be dynamically set at app load time.
  * **historicalRanges**: An array of date range objects denoting specific time periods in the past when imagery is available. Each range object should have the following properties:
    * startDate - `YYYY-MM-DDTHH:MM:SSZ`
    * endDate - `YYYY-MM-DDTHH:MM:SSZ`
    * dateInterval - Number of days (or minutes for subdaily layers)
* **temporal**: Used to override the layer temporal availability declared in the capabilities document. Note: Changing the temporal availability can cause missing layer coverage within the interface for layers tiles that aren't available from the source at the revised temporal range. This option can be added as a string with the new availability range. For example, `"1981-10-13/2019-10-11/P1M"`.
* **count**: Used to override the default number of granules displayed on the map and in the granule count slider component for granule layers.
* **cmrAvailability**: Boolean - Whether or not to use the CMR API for data availability.

## Full Example

```json
{
  "layers": {
    "AIRS_RelativeHumidity_400hPa_Day": {
      "id": "AIRS_RelativeHumidity_400hPa_Day",
      "tags": "rh",
      "group": "overlays",
      "period": "daily",
      "startDate": "2013-07-16",
      "projections": {
        "geographic": {
          "source": "GIBS:geographic",
          "matrixSet": "EPSG4326_2km"
        }
      },
      "layergroup": "Relative Humidity",
      "palette": {
        "id": "AIRS_RH400_A"
      },
      "temporal": "1981-10-13/2019-10-11/P1M",
      "cmrAvailability": false
    }
  }
}
```

## Vector Layers

For information specific to configuring vector layers, see the [Vector Layers](vectors.md) documentation.

## Creating Granule Layer
Granule layers will require specific configuration options within the `config/wv.json/layers` respective satellite instrument folder.

### Granule Layer Example
```json
{
  "layers": {
    "VIIRS_NOAA20_CorrectedReflectance_BandsM3-I3-M11_Granule_v1_NRT": {
      "id": "VIIRS_NOAA20_CorrectedReflectance_BandsM3-I3-M11_Granule_v1_NRT",
      "subtitle": "NOAA-20 / VIIRS",
      "description": "viirs/VIIRS_NOAA20_CorrectedReflectance_BandsM3-I3-M11",
      "tags": "subdaily",
      "group": "overlays",
      "layergroup": [
        "viirs"
      ],
      "ongoing": true,
      "type": "granule",
      "cmrAvailability": true,
      "period": "subdaily",
      "count": 1
    }
  }
}
```

Note:
```json
  "type": "granule",
  "period": "subdaily",
  "subtitle": "NOAA-20 / VIIRS", (used to match satellite/instrument)
```

### Granule Layer CMR Requirements

Granule layers rely on Common Metadata Repository (CMR) metadata to collect footprint polygon metadata for visible granules.

The following parameters need to be present in the CMR responsefor the granule layer:
```js
"feed.entry" [
  {
    "time_start": "2020-08-06T00:48:00.000Z",
    "polygons": [
      [
      "-68.998596 172.739944 -59.319592 -123.048164 -42.500546 -144.210709 -48.444565 176.622818 -68.998596 172.739944"
      ]
    ],
    ...(other CMR required parameters)*
  }
]

* This is where additional parsing can be done (e.g., determine satellite number);
  however, will need coordination/client side granule processing changes.
```
