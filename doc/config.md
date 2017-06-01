# Configuration

The configuration used by the official NASA EOSDIS Worldview application can be found here:

<https://github.com/nasa-gibs/worldview-options-eosdis>

A basic configuration that only includes three starting layers can be found here:

<https://github.com/nasa-gibs/worldview-options-template>

To customize the configuration of the application, use either repository above as a starting point.

## General Notes

Information here is incomplete and can be flushed out on an as-needed basis.

All paths in the document are relative to the options repository root unless specified otherwise.

After making any changes to the configuration, run ``grunt config`` from the command line to rebuild the configuration for use by the application.

## New Layers

Create a new JSON document in ``config/wv.json/layers`` named ``X.json`` where ``X`` is the layer identifier used in the WMTS or WMS call. This file can be placed in any subdirectory as needed for organizational purposes.

The following is the minimum configuration needed for the Aerosol Optical Depth layer:

```json
{
    "layers": {
        "MODIS_Aqua_Aerosol": {
            "id":       "MODIS_Aqua_Aerosol",
            "title":    "Aerosol Optical Depth",
            "subtitle": "Aqua / MODIS",
            "group":    "overlays"
        }
    }
}
```

All properties should be in an object keyed by the layer identifier used in the WMTS of WMS call.

### Required Properties

The minimum set of required properties are as follows:

- **id**: The layer identifier used in the WMTS or WMS call
- **title**: Title of the layer displayed to the end user. This is the first line displayed in the active layers list.
- **subtitle**: Subtitle of the layer displayed to the end user. This is the second line displayed in the active layers list and usually includes platform, sensor, and/or attribution information.
- **group**: The group this layer should be found in, either *baselayers* or *overlays*

The following properties are required if this information is not available via the GIBS WMTS GetCapabilities document:

- **type**: Tile service type, either *wmts* or *wms*.
- **format**: Image format type, either *image/png* or *image/jpeg*.
- **tileSize**: For WMS layers only, an array of pixel dimensions used to tile the requests. For example, *[512, 512]*
- **period**: Use *daily* for layers that have new content each day, otherwise use *static*.
- **startDate**: For daily layers, the first day in ``YYYY-MM-DD`` format that data is available
- **inactive**: If the daily layer is no longer being produced, this should be present with a *true* value. Otherwise, this property can be omitted.
- **endDate**: If the daily layer is no longer being produced, the last day in ``YYYY-MM-DD`` format that data was available.

A *projections* object must exist which contains an object for each projection supported by this layer. Projection information is keyed by the projection identifier (found in ``config/wv.json/projections``). Example:

```json
"projections": {
	"antarctic": {
		"source":     "GIBS:antarctic",
		"matrixSet":  "EPSG3031_250m"
	},
    "arctic": {
		"source": 	"GIBS:arctic",
		"matrixSet":  "EPSG3413_250m"
	}
}
```

The projection parameters are as follows:

- **source**: Identifier that indicates which endpoint contains this layer (see ``config/wv.json/sources.json``)
- **matrixSet**: For WMTS layers only, the name of the matrix set as defined in the endpoint's GetCapabilities document.

### Layer Order

The ``config/wv.json/layerOrder.json`` file must be updated to include the new layer identifier. This file determines the order that layers are displayed in the add layers tab.


### Optional Properties

- **tags**: Additional text used for matching this layer when searching in the add layers tab. This allows Aerosol Optical Depth layers to match when "aod" is typed in
- **noTransition**: For WMTS layers only, if set to *true*, the map will not display lower-resolution tiles while loading.
- **transition**: For WMS layers only, if set to *true*, the map will display lower-resolution tiles while loading.
- **product**: Identifier of the product to use when searching the Common Metadata Repository (CMR) to download data. See the [Data Download documentation](data_download.md) for more information.
- **style**: For WMTS layers only, this sets the WMTS `style` parameter accordingly; defaults to `default` if not set.
- **matrixIds**: For WMTS layers only, this is an array of labels used for the `TileMatrix` parameter at each zoom level; defaults to `[0, 1, 2, ...]` if not set.

To display a color palette legend, a *palette* object should exist with the following properties:

- **id**: Identifier of the palette. This should match the name of the colormap file without the extension.
- **recommended**: Array of custom palette identifiers that are recommended for use with this layer (see ``config/palettes-custom.json``). Example, *["orange_1", "red_1"]*

### Full Example

```json
{
    "layers": {
        "AIRS_RelativeHumidity_400hPa_Day": {
            "id":       "AIRS_RelativeHumidity_400hPa_Day",
            "title":    "Relative Humidity (400 hPa, Day)",
            "subtitle": "Aqua / AIRS",
            "tags":     "rh",
            "group":    "overlays",
            "product":  "AIRX2RET_DAY",

            "format":   "image/png",
            "type":     "wmts",

            "period":       "daily",
            "startDate":    "2013-07-16",

            "projections": {
                "geographic": {
                    "source":       "GIBS:geographic",
                    "matrixSet":    "EPSG4326_2km"
                }
            },

            "palette": {
                "id": "AIRS_RH400_A"
            }
        }
    }
}
```

## New Map Sources

Modify the JSON document, ``config/wv.json/sources.json``. There is a *sources* object that contains an object for each map source keyed by the source identifier. For layers that can be configured via a GIBS WMTS GetCapabilities document or for WMS layers, the only property required is:

- **url**: Either a string or array of strings where the map service is found.

For WMTS layers that cannot be configured with a GetCapabilities document, a *matrixSets* object must exist that contains an object for each matrix set, keyed by the matrix set identifier.

- **id**: The identifier for this matrix set.
- **maxResolution**: The maximum resolution of this of this matrix tile set as defined in the OpenLayers 2 documentation. This property might be deprecated in the future as it can be obtained from the *resolutions* property.
- **resolutions**: Array of resolutions for each zoom level as defined in the OpenLayers 2 documentation.
- **tileSize**: Array of pixel dimensions for each tile. Example *[512, 512]*

### Full Example
```json
{
    "sources": {
        "GIBS:arctic": {
            "url": [
                "//map1a.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi",
                "//map1b.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi",
                "//map1c.vis.earthdata.nasa.gov/wmts-arctic/wmts.cgi"
            ],
            "matrixSets": {
                "EPSG3413_250m": {
                    "id": "EPSG3413_250m",
                    "maxResolution": 8192,
                    "resolutions": [8192, 4096, 2048, 1024, 512],
                    "tileSize": [512, 512]
                }
            }
        }
    }
}
```

### GetCapabilities

To automatically fetch configuration information from the GetCapabilities document, modify the ``config.json`` file and add an object to the *wv-options-fetch* object with the following properties:

- **from**: The URL to fetch the GetCapabilities document
- **to**: Name of the temporary file used to store the GetCapabilities document.

Now add an object to the *wv-options-wmts* object with the following properties:

- **source**: The identifier of the source that corresponds to this endpoint.
- **from**: The name of the temporary file used int he *wv-options-fetch* object.
- **to**: The name of the temporary output JSON file.
- **projection**: The identifier of the projection used in this endpoint (see ``config/wv.json/projections``)
- **maxResolution**: The resolution of first tile matrix entry.

### config.json Example

```json
{
    "wv-options-fetch": [
        {
            "from": "https://map1.vis.earthdata.nasa.gov/wmts-geo/wmts.cgi?request=GetCapabilities",
            "to": "gibs-geographic.xml"
        },
    ],
    "wv-options-wmts": [
        {
            "source": "GIBS:geographic",
            "from": "gibs-geographic.xml",
            "to": "gibs-geographic.json",
            "projection": "geographic",
            "maxResolution": 0.5625
        }
    ]
}
```
