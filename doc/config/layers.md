# Configuration

## Table of Contents

* [Overview](configuration.md)
* [Adding New Layers](layers.md)
  * [Vector Layers](vectors.md)
  * [Adding Layers to Layer Picker](product_picker.md)
* [Adding New Tour Stories](tour_stories.md)

---

## Adding New Layers

Create a new JSON document in `config/default/common/config/wv.json/layers` named `X.json` where `X`
is the layer identifier used in the WMTS or WMS API call. This file can be
placed in any subdirectory as needed for organizational purposes.

Here's an example of a minimum configuration for the Aerosol Optical Depth layer:

```json
{
  "layers": {
    "MODIS_Aqua_Aerosol": {
      "id": "MODIS_Aqua_Aerosol",
      "title": "Aerosol Optical Depth",
      "subtitle": "Aqua / MODIS",
      "group": "overlays"
    }
  }
}
```

All properties should be in an object keyed by the layer identifier used in the
WMTS of WMS API call.

## Layer Order

The `config/default/common/config/wv.json/layerOrder.json` file must be updated to include the new layer identifier. This file determines the order that layers are displayed in the add layers tab.

## Required Properties

The minimum set of required properties are as follows:

* **id**: The layer identifier used in the WMTS or WMS call
* **title**: Title of the layer displayed to the end user. This is the first line displayed in the active layers list.
* **subtitle**: Subtitle of the layer displayed to the end user. This is the second line displayed in the active layers list and usually includes platform, sensor, and/or attribution information.
* **group**: The group this layer is found in, either `baselayers` or `overlays`
* **layergroup**: A reference to the layer group the layer belongs to (usually the folder name it's contained in; i.e. airs, modis, reference_orbits).

The following properties are required if this information is not available via the GIBS WMTS GetCapabilities document:

* **type**: Tile service type, either `wmts`, `wms`, or `vector`.
* **format**: Image format type, either `image/png` or `image/jpeg`.
* **tileSize**: For WMS layers only, an array of pixel dimensions used to tile the requests. For example, `[512, 512]`
* **period**: Use `subdaily`, `daily`, `monthly`, or `yearly` for layers that have new content and no startDate defined in GetCapabilities. Changing the period will affect how often the layer is requested in the timeline. Omit this parameter to always have the layer shown on the timeline.
* **startDate**: The first day that data is available, represented in YYYY-MM-DD or YYYY-MM-DDThh:mm:ssZ format.
* **endDate**: The last day that data is available, represented in YYYY-MM-DD or YYYY-MM-DDThh:mm:ssZ format.
* **inactive**: Use `true` if the layer is no longer being produced.
* **futureLayer**: Use `true` if the layer has an end date after the current date.
* **futureTime**: Use `[number][type="D,M,Y"]` (i.e. "3D")  with the `futurelayer` parameter to denote a layer that has a dynamic, future end date. The `[number]` parameter represents the dateInterval, `[type]` can be equal to `"D"`, `"M"`, or `"Y"` to represent day, month or year interval.

A *projections* object must exist which contains an object for each projection supported by this layer. Projection information is keyed by the projection identifier (found in `config/default/common/config/wv.json/projections`). Example:

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

The projection parameters are as follows:

* **source**: Identifier that indicates which endpoint contains this layer (see `config/default/common/config/wv.json/sources.json`)
* **matrixSet**: For WMTS layers only, the name of the matrix set as defined in the endpoint's GetCapabilities document.

## Optional Properties

* **tags**: Additional text used for matching this layer when searching in the add layers tab. This allows Aerosol Optical Depth layers to match when "aod" is typed in
* **noTransition**: For WMTS layers only, if set to `true`, the map will not display lower-resolution tiles while loading.
* **transition**: For WMS layers only, if set to `true`, the map will display lower-resolution tiles while loading.
* **product**: Identifier of the product to use when searching the Common Metadata Repository (CMR) to download data. Can also be a list of identifiers to map the layer to multiple CMR products. See the [Data Download documentation](../data_download.md) for more information.
* **style**: For WMTS layers only, this sets the WMTS `style` parameter accordingly; defaults to `default` if not set.
* **matrixIds**: For WMTS layers only, this is an array of labels used for the `TileMatrix` parameter at each zoom level; defaults to `[0, 1, 2, ...]` if not set.
* **daynight**: Classify a layer as day or night. This information will be displayed within the title of the layer in the Measurement / Sources add modal view if provided.
* **track**: Classify a layer's track direction. This will usually be either ascending or descending and will be displayed within the title of the layer in the Measurement / Sources add modal view if provided.
* **description**: Point to a markdown file within the metadata folder to provide a layer description.
* **wrapX**: Wrap the layer across the anti-meridian.
* **wrapadjacentdays**: Wrap the layer across the anti-meridian but select the previous day when greater than 180 and the next day when less than -180.
* **palette**: To display a color palette legend, a `palette` object should exist with the following properties:
  * **id**: Identifier of the palette. This should match the name of the colormap file without the extension.
  * **recommended**: Array of custom palette identifiers that are recommended for use with this layer (see `config/default/common/config/palettes-custom.json`). Example, *["orange_1", "red_1"]*
  * **immutable**(optional): When this flag is set to true, the options to adjust thresholds and colormaps are removed.
* **availability**: Used to denote datetime availability info that cannot be gleaned from the capabilities document. Primarily for our geostationary layers which only have historical coverage going back ~30 days. Represented as an object with the following properties:
  * **rollingWindow**: Number of days, counting backwards from app load time, that a layer has avilable coverage.  Setting this will cause a layer's `startDate` property to be dynamically set at app load time.
  * **historicalRanges**: An array of date range objects denoting specific time periods in the past when imagery is available. Each range object should have the following properties:
    * startDate - `YYYY-MM-DDTHH:MM:SSZ`
    * endDate - `YYYY-MM-DDTHH:MM:SSZ`
    * dateInterval - Number of days (or minutes for subdaily layers)

## Full Example

```json
{
  "layers": {
    "AIRS_RelativeHumidity_400hPa_Day": {
      "id": "AIRS_RelativeHumidity_400hPa_Day",
      "title": "Relative Humidity (400 hPa, Day)",
      "subtitle": "Aqua / AIRS",
      "tags": "rh",
      "group": "overlays",
      "product": "AIRX2RET_DAY",
      "period": "daily",
      "startDate": "2013-07-16",
      "projections": {
        "geographic": {
          "source": "GIBS:geographic",
          "matrixSet": "EPSG4326_2km"
        }
      },
      "layergroup": [
        "airs"
      ],
      "daynight": [ "day" ],
      "track": "descending",
      "palette": {
        "id": "AIRS_RH400_A"
      }
    }
  }
}
```

## Vector Layers

For information specific to configuring vector layers, see the [Vector Layers](vectors.md) documentation.
