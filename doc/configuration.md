# Configuration

The configuration used in the main application at `https://worldview.earthdata.nasa.gov` is built from the various JSON files found in the `config/default` directory.

To create a custom configuration, either:
  * Copy the `config/default` directory to `config/active` and modify it as needed.
  * Clone the basic template repository with a minimual configuration to `config/active`

Any configuration found in `config/active` will be used instead of `config/default`.

Clone the template repository with:

```bash
git clone https://github.com/nasa-gibs/worldview-options-template.git config/active
```

To quickly switch between different configurations, use a symlink for `config/active`

## Updating the Configuration

After making any changes to a custom configuration, rebuild the app for the
changes to take effect. Use the `npm run getcapabilities` command to make a request to [the GIBS GetCapabilities API](https://wiki.earthdata.nasa.gov/display/GIBS/GIBS+API+for+Developers)
and update layer configurations; then use `npm run build:config` to rebuild the
configuration for use by the application. Run these commands separately
as needed or use `npm run updateconfig` as a shortcut to run both.

### Subdirectories

If you have a custom configuration in a subdirectory of `config/` other than
`config/release/`, pass in the name of the subdirectory to use with
`CONFIG_ENV=subdirectory_name npm run build:config`. To build an incomplete configuration,
prefix the command like this: `IGNORE_ERRORS=true npm run build:config`.

## New Layers

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

### Required Properties

The minimum set of required properties are as follows:

- **id**: The layer identifier used in the WMTS or WMS call
- **title**: Title of the layer displayed to the end user. This is the first line displayed in the active layers list.
- **subtitle**: Subtitle of the layer displayed to the end user. This is the second line displayed in the active layers list and usually includes platform, sensor, and/or attribution information.
- **group**: The group this layer is found in, either `baselayers` or `overlays`
- **layergroup**: A reference to the layer group the layer belongs to (usually the folder name it's contained in; i.e. airs, modis, reference_orbits).

The following properties are required if this information is not available via the GIBS WMTS GetCapabilities document:

- **type**: Tile service type, either `wmts`, `wms`, or `vector`.
- **format**: Image format type, either `image/png` or `image/jpeg`.
- **tileSize**: For WMS layers only, an array of pixel dimensions used to tile the requests. For example, `[512, 512]`
- **period**: Use `subdaily`, `daily`, `monthly`, or `yearly` for layers that have new content and no startDate defined in GetCapabilities. Changing the period will affect how often the layer is requested in the timeline. Omit this parameter to always have the layer shown on the timeline.
- **startDate**: The first day that data is available, represented in YYYY-MM-DD or YYYY-MM-DDThh:mm:ssZ format.
- **endDate**: The last day that data is available, represented in YYYY-MM-DD or YYYY-MM-DDThh:mm:ssZ format.
- **inactive**: Use `true` if the layer is no longer being produced.
- **futureLayer**: Use `true` if the layer has an end date after the current date.
- **futureTime**: Use `[number][type="D,M,Y"]` (i.e. "3D")  with the `futurelayer` parameter to denote a layer that has a dynamic, future end date. The `[number]` parameter represents the dateInterval, `[type]` can be equal to `"D"`, `"M"`, or `"Y"` to represent day, month or year interval.

A *projections* object must exist which contains an object for each projection supported by this layer. Projection information is keyed by the projection identifier (found in `config/default/common/config/wv.json/projections`). Example:

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

- **source**: Identifier that indicates which endpoint contains this layer (see `config/default/common/config/wv.json/sources.json`)
- **matrixSet**: For WMTS layers only, the name of the matrix set as defined in the endpoint's GetCapabilities document.

### Layer Order

The `config/default/common/config/wv.json/layerOrder.json` file must be updated to include the new layer identifier. This file determines the order that layers are displayed in the add layers tab.

### Optional Properties

- **tags**: Additional text used for matching this layer when searching in the add layers tab. This allows Aerosol Optical Depth layers to match when "aod" is typed in
- **noTransition**: For WMTS layers only, if set to `true`, the map will not display lower-resolution tiles while loading.
- **transition**: For WMS layers only, if set to `true`, the map will display lower-resolution tiles while loading.
- **product**: Identifier of the product to use when searching the Common Metadata Repository (CMR) to download data. Can also be a list of identifiers to map the layer to multiple CMR products. See the [Data Download documentation](data_download.md) for more information.
- **style**: For WMTS layers only, this sets the WMTS `style` parameter accordingly; defaults to `default` if not set.
- **matrixIds**: For WMTS layers only, this is an array of labels used for the `TileMatrix` parameter at each zoom level; defaults to `[0, 1, 2, ...]` if not set.
- **daynight**: Classify a layer as day or night. This information will be displayed within the title of the layer in the Measurement / Sources add modal view if provided.
- **track**: Classify a layer's track direction. This will usually be either ascending or descending and will be displayed within the title of the layer in the Measurement / Sources add modal view if provided.
- **description**: Point to a markdown file within the metadata folder to provide a layer description.
- **wrapX**: Wrap the layer across the anti-meridian.
- **wrapadjacentdays**: Wrap the layer across the anti-meridian but select the previous day when greater than 180 and the next day when less than -180.
- **availability**: Used to denote datetime availability info that cannot be gleaned from the capabilities document. Primarily for our geostationary layers which only have historical coverage going back ~30 days. Represented as an object with the following properties:
  - **rollingWindow**: Number of days, counting backwards from app load time, that a layer has avilable coverage.  Setting this will cause a layer's `startDate` property to be dynamically set at app load time.
  - **historicalRanges**: An array of date range objects denoting specific time periods in the past when imagery is available. Each range object should have the following properties:
    - startDate - `YYYY-MM-DDTHH:MM:SSZ`
    - endDate - `YYYY-MM-DDTHH:MM:SSZ`
    - dateInterval - Number of days (or minutes for subdaily layers)

To display a color palette legend, a `palette` object should exist with the following properties:

- **id**: Identifier of the palette. This should match the name of the colormap file without the extension.
- **recommended**: Array of custom palette identifiers that are recommended for use with this layer (see `config/default/common/config/palettes-custom.json`). Example, *["orange_1", "red_1"]*
- **immutable**(optional): When this flag is set to true, the options to adjust thresholds and colormaps are removed.

### Full Example

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
      "format": "image/png",
      "type": "wmts",
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

### Creating Custom Vector Styles
Vector layers created from the Global Imagery Browse Services (GIBS) will have a default style.json file associated with the layer defined in the GIBS WMTS GetCapabilities document. The vector style JSON file follows the [mapbox-gl-js style spec](https://docs.mapbox.com/mapbox-gl-js/style-spec/). The layey's default style will be extracted from the GetCapabilities document and assigned to it's associated layer on build.

To display a custom vector layer style & legend, a *vectorStyle* object should exist with the following properties:

- **id**: Identifier of the vector style. This should match the name of the colormap file without the extension.

### Vector Layer Example
```json
{
  "layers": {
    "OrbitTracks_Aqua_Ascending": {
      "id":       "OrbitTracks_Aqua_Ascending",
      "title":    "Orbit Tracks (Ascending, Points, Aqua)",
      "description": "vector/OrbitTracks_Aqua_Ascending",
      "type":     "vector",
      "group":    "overlays",
      "layergroup": [
        "vector"
      ],
      "vectorStyle": {
        "id": "OrbitTracks_Aqua_Ascending"
      },
      "period": "daily"
    }
  }
}
```

### Vector Style Example

The following is an example of a basic vector style. This vector layer is referenced in the "source-layer" and has line, point, and label features being styled. Each unique "source" defined within the vector style document will add a new style option to the layer settings panel and can be passed to the layer's style param in the URL. The legend in the layer settings panel will be rendered using the color identified in the style's paint settings (with circle taking presendence over line, polygon and label).

For more information on how to configure a mapbox-gl-js style spec, please refer to the [documentation]((https://docs.mapbox.com/mapbox-gl-js/style-spec/)).

```json
{
  "version": 8,
  "name": "Orbit Tracks",
  "sources": {
    "OrbitTracks_Aqua_Ascending": {
      "type": "vector",
      "tiles": [
        "https://gibs.earthdata.nasa.gov/wmts/epsg4326/nrt/OrbitTracks_Aqua_Ascending/default/{Time}/{TileMatrixSet}/{TileMatrix}/{TileRow}/{TileCol}.mvt"
      ]
    }
  },
  "layers": [
    {
      "id": "OrbitTracks_Aqua_Ascending",
      "source": "OrbitTracks_Aqua_Ascending",
      "source-layer": "OrbitTracks_Aqua_Ascending",
      "source-description": "Default",
      "type": "line",
      "paint": {
        "line-color": "rgb(21, 192, 230)",
        "line-width": 2
      }
    },
    {
      "id": "OrbitTracks_Aqua_Ascending",
      "source": "OrbitTracks_Aqua_Ascending",
      "source-layer": "OrbitTracks_Aqua_Ascending",
      "source-description": "Default",
      "type": "circle",
      "paint": {
        "circle-radius": "5",
        "circle-color": "rgb(21, 192, 230)"
      }
    },
    {
      "id": "OrbitTracks_Aqua_Ascending",
      "source": "OrbitTracks_Aqua_Ascending",
      "source-layer": "OrbitTracks_Aqua_Ascending",
      "source-description": "Default",
      "type": "symbol",
      "layout": {
        "text-field": ["get", "label"],
        "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
        "text-size": 10,
        "text-transform": "uppercase",
        "text-letter-spacing": 0.05,
        "text-offset": [-2.5, 0]
      },
      "paint": {
        "text-color": "#fff",
        "text-halo-color": "#999",
        "text-halo-width": 1
      }
    }
  ]
}
```
## Vector Metadata

Vector layers created from the Global Imagery Browse Services (GIBS) will have a metadata JSON file associated with the layer defined in the GIBS WMTS GetCapabilities document. This metadata document describes features contained within the MVT file. This data is available to give context to the features stored within a layer. This information can be seen when a user clicks on a vector data point. A modal will appear with labels, values and tooltips. The data from this document appears within the tooltip element.

## Adding Layers to Worldview and the Product Picker

New layers in the Global Imagery Browse Services (GIBS) can be added to Worldview using the following instructions.

First, layers must be added to `config/default/common/config/wv.json/layers` and `config/default/common/config/wv.json/layerOrder.json`. Then they must be added to the `config/default/common/config/wv.json/measurements` and `config/default/common/config/wv.json/categories` folders so that they will be categorized in the Product Picker. Lastly, if the layers have descriptions these can be added in `config/default/common/config/metadata` and if they are available in the Common Metadata Repository (CMR), data download may be enabled for those layers.

- Fetch GIBS GetCapabilities with `npm run getcapabilities`. This gets the latest layer information and colormaps from GIBS.
- Add new layer(s)
  - Follow [New Layers](configuration.md#new-layers) above to create JSON file in `config/default/common/config/wv.json/layers`.
- Add to Measurements
  - Add to relevant measurement or create a new JSON file in `config/default/common/config/wv.json/measurements`.
- Add to Categories
  - Add to relevant category (legacy (a.k.a. hazards and disasters) and scientific) or create a new JSON file in the relevant category in `config/default/common/config/wv.json/categories`.
- Add to Layer Order
  - Add to `config/default/common/config/wv.json/layerOrder.json`.
- Add layer to Image Download
  - *Worldview Snapshots Team adds layers to Image Download*
- Add Layer descriptions/metadata, if it exists
  - Create .md file in `config/default/common/config/metadata`. The *description* (i.e. layer description/metadata) identifier has to be added to the corresponding measurement JSON file.
- Add Data Download for product, if it exists
  - Refer to [Data Download](data_download.md) and create JSON file in `config/default/common/config/wv.json/products`. The *product* identifier has to be added to the corresponding layer JSON file.
- Rebuild the configuration with `npm run build:config` for use by the application.

## New Map Sources

Modify the JSON document, `config/default/common/config/wv.json/sources.json`. There is a *sources*
object that contains an object for each map source keyed by the source identifier.
For layers that can be configured via a GIBS WMTS GetCapabilities document or
for WMS layers, the only property required is:

- **url**: Either a string or array of strings where the map service is found.

For WMTS layers that cannot be configured with a GetCapabilities document, a
*matrixSets* object must exist that contains an object for each matrix set,
keyed by the matrix set identifier.

- **id**: The identifier for this matrix set.
- **maxResolution**: The maximum resolution of this of this matrix tile set as defined in the [OpenLayers 2 documentation](http://dev.openlayers.org/docs/files/OpenLayers/Layer-js.html#OpenLayers.Layer.maxResolution). This property might be deprecated in the future as it can be obtained from the *resolutions* property.
- **resolutions**: Array of resolutions for each zoom level as defined in the [OpenLayers 2 documentation](http://dev.openlayers.org/docs/files/OpenLayers/Layer-js.html#OpenLayers.Layer.maxResolution).
- **tileSize**: Array of pixel dimensions for each tile. Example; `[512, 512]`

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

To automatically fetch configuration information from the GetCapabilities
document, modify the `config/default/release/config.json` file and add an object to the
`wv-options-fetch` object with the following properties:

- **from**: The URL to fetch the GetCapabilities document
- **to**: Name of the temporary file used to store the GetCapabilities document.

Now add an object to the `wv-options-wmts` object with the following properties:

- **source**: The identifier of the source that corresponds to this endpoint.
- **from**: The name of the temporary file used int he `wv-options-fetch` object.
- **to**: The name of the temporary output JSON file.
- **projection**: The identifier of the projection used in this endpoint (see `config/default/common/config/wv.json/projections`)
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

## New Tour Stories

Create a new JSON document in `config/default/common/config/wv.json/stories` named `X.json` where `X`
is the story identifier. This file can be placed in any subdirectory as needed for organizational purposes.

Here's an example of a minimum configuration for the Hurricane Florence story:

```json
{
  "stories": {
    "hurricane_florence_september_2018": {
      "id": "hurricane_florence_september_2018",
      "title": "Hurricane Florence (September 2018)",
      "steps": [
        {
          "description": "step001.html",
          "stepLink": "p=geographic&l=VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,IMERG_Precipitation_Rate,Reference_Labels,Reference_Features,Coastlines(hidden)&t=2018-09-12-T00%3A00%3A00Z&z=3&t1=2018-09-19-T00%3A00%3A00Z&v=-91.32690967327403,23.259234869248033,-57.57690967327403,39.74751611924803"
        }
      ]
    }
  }
}
```

All properties should be in an object keyed by the story identifier.

### Required Properties

The minimum set of required properties are as follows:

- **id**: The story identifier.
- **title**: Title of the story displayed to the end user. This is displayed in the story overview modal and the story in-progress modal.

To display story steps in the in-progress modal, a **steps** object should exist with the following properties:
- **description**: points to a metadata markdown file located in `config/default/common/config/metadata/stories/`_`[story_id]`_`/`
- **stepLink**: The URL parameters of a linked Worldview instance separated by an `&` symbol (i.e. `p=geographic&t1=2018-12-30`)

Optional **steps** parameter:
- **transition**: Advanced Configuration. An object containing an **element** and a custom **action**. These transitions occur between changing steps; these require custom code to target the element and an action to action upon that element.
i.e. the following code will play the animation if the animation widget is present.

```json
{
  "id": "004",
  "description": "step004.html",
  "transition": {
    "element": "animation",
    "action": "play"
  },
  "stepLink": "v=-139.69542125350569,34.20775389990919,-107.14073375350569,49.67650389990919&t=2019-05-11-T16%3A46%3A06Z&l=Reference_Labels(hidden),Reference_Features(hidden),Coastlines(opacity=0.19),VIIRS_NOAA20_CorrectedReflectance_TrueColor(hidden),VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor"
}
```

### Story Order

The `config/default/common/config/wv.json/storyOrder.json` file must be updated to include the new story identifier. This file determines the order that stories are displayed in the overview modal.

### Optional properties:

- **type**: Use `wildfire`, `volcano`, `snow`, `sea-and-lake-ice`, `iceberg`, `water-color`, `dust-and-haze`, `severe-storm`, `man-made` or `critical` to set the display of the event. Each event will have a color and icon associated with it's type. If left blank, the event will default to dark blue and a world icon.
- **description**: A description of the story displayed to the end user when hovering the story's box on the overview modal.
- **backgroundImage**: The background image shown on the story overview modal. This image should be **396px x 396px**, a JPG/JPEG, GIF or PNG, and optimized in size for the web. If no image is provided, a NASA logo will be shown as a placeholder.
- **backgroundImageHover**: The image shown when overing the background image on the story overview modal. This image should be **396px x 396px**, a JPG/JPEG, GIF or PNG, and optimized in size for the web. If no image is provided, no roll-over image will appear.

To display read more links on the end of story modal, a *readMoreLinks* object should exist with the following properties:

- **title**: The name of the link being displayed.
- **link**: The url of the link being displayed.

### Full Example

```json
{
  "stories": {
    "hurricane_florence_september_2018": {
      "id": "hurricane_florence_september_2018",
      "title": "Hurricane Florence (September 2018)",
      "description": "Hurricane Florence wrecked havoc on the Carolinas. Use the A|B tool to see a before and after of the coast.",
      "type": "severe-storm",
      "backgroundImage": "background.png",
      "backgroundImageHover": "backgroundHover.png",
      "readMoreLinks": [
        {
          "title": "Earth Observatory - Hurricane Florence",
          "link": "https://earthobservatory.nasa.gov/images/Event/92748/hurricane-florence"
        }
      ],
      "steps": [
        {
          "description": "step001.html",
          "stepLink": "p=geographic&l=VIIRS_SNPP_CorrectedReflectance_TrueColor(hidden),MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor,IMERG_Precipitation_Rate,Reference_Labels,Reference_Features,Coastlines(hidden)&t=2018-09-12-T00%3A00%3A00Z&z=3&t1=2018-09-19-T00%3A00%3A00Z&v=-91.32690967327403,23.259234869248033,-57.57690967327403,39.74751611924803"
        },
        {
          "description": "step002.html",
          "stepLink": "p=geographic&l=VIIRS_SNPP_CorrectedReflectance_TrueColor,MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor(hidden),Reference_Labels,Reference_Features,Coastlines(hidden)&t=2018-09-02-T00%3A00%3A00Z&z=3&t1=2018-09-19-T00%3A00%3A00Z&v=-82.86647987040818,4.465382946172927,-15.366479870408185,37.44194544617292"
        },
        {
          "description": "step003.html",
          "transition": {
            "element": "animation",
            "action": "play"
          },
          "stepLink": "p=geographic&l=VIIRS_SNPP_CorrectedReflectance_TrueColor,MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor(hidden),Reference_Labels,Reference_Features(hidden),Coastlines(hidden)&t=2018-09-02-T00%3A00%3A00Z&z=3&t1=2018-09-19-T00%3A00%3A00Z&v=-113.05825121261012,-7.7039155910611115,-10.61293871261011,58.24920940893889&ab=on&as=2018-09-02T00%3A00%3A00Z&ae=2018-09-14T00%3A00%3A00Z&av=8&al=false"
        },
        {
          "description": "step004.html",
          "stepLink": "p=geographic&l=VIIRS_SNPP_CorrectedReflectance_TrueColor,MODIS_Aqua_CorrectedReflectance_TrueColor(hidden),MODIS_Terra_CorrectedReflectance_TrueColor(hidden),Reference_Labels,Reference_Features(hidden),Coastlines(hidden)&t=2018-09-14-T00%3A00%3A00Z&z=3&t1=2018-09-19-T00%3A00%3A00Z&v=-105.3766105876101,15.639834408938874,-54.1539543376101,48.616396908938874&ab=on&as=2018-09-02T00%3A00%3A00Z&ae=2018-09-14T00%3A00%3A00Z&av=8&al=false"
        },
      ]
    }
  }
}
```

## Adding Stories to Worldview Tour Modals

New stories can be added to the Worldview tour modals via the following instructions.

First, stories must be added to `config/default/common/config/wv.json/stories` and `config/default/common/config/wv.json/storyOrder.json`. Then, step descriptions and the overview background image(s) can be added in `config/default/common/config/metadata/stories/`_`[story_id]`_`/`.

- Add New Tour Storie(s)
  - Follow [New Tour Stories](configuration.md#new-tour-stories) above to create JSON file in `config/default/common/config/wv.json/stories`.
- Add to Story Order
  - Add to `config/default/common/config/wv.json/storyOrder.json`.
- Add story step descriptions/metadata & overview background images
  - Create .md file in `config/default/common/config/metadata/stories/`_`[story_id]`_`/`. The *story_id* folder identifier should be labeled the same as the folder identifier in `config/default/common/config/wv.json/stories/`_`[story_id]`_`/`. Each step defined in the metadata folder will need to correspond to the `description` parameter within that file.
- Rebuild the configuration with `npm run build:config` for use by the application.

### Creating Granule Layer
Granule layers will require specific configuration options within the `config/wv.json/layers` respective satellite instrument folder.

### Granule Layer Example
```json
{
  "layers": {
    "VIIRS_NOAA20_CorrectedReflectance_BandsM3-I3-M11_Granule_v1_NRT": {
      "id": "VIIRS_NOAA20_CorrectedReflectance_BandsM3-I3-M11_Granule_v1_NRT",
      "title": "Corrected Reflectance (M3-I3-M11, Granules, v1, Near Real-Time, VIIRS, NOAA-20)",
      "subtitle": "NOAA-20 / VIIRS",
      "description": "viirs/VIIRS_NOAA20_CorrectedReflectance_BandsM3-I3-M11",
      "tags": "subdaily",
      "group": "overlays",
      "layergroup": [
        "viirs"
      ],
      "inactive": true,
      "isGranule": true,
      "period": "subdaily",
      "tracks": [
        "OrbitTracks_NOAA-20_Ascending"
      ]
    }
  }
}
```

Note:
```json
  "isGranule": true,
  "period": "subdaily",
  "subtitle": "NOAA-20 / VIIRS", (used to match satellite/instrument)
```

### Granule Layer CMR Requirements

Granule layers rely on Common Metadata Repository (CMR) metadata to 1) filter day/night collections, 2) determine range based on filters, and 3) collect time/polygon data for selected granules.

The following parameters need to be present in the CMR for the granule layer:
```js
"feed.entry" [
  {
    "time_start": "2020-08-06T00:48:00.000Z",
    "polygons": [
      [
      "-68.998596 172.739944 -59.319592 -123.048164 -42.500546 -144.210709 -48.444565 176.622818 -68.998596 172.739944"
      ]
    ],
    "day_night_flag": "DAY",
    ...(other CMR required parameters)*
  }
]

* This is where additional parsing can be done (e.g., determine satellite number);
  however, will need coordination/client side granule processing changes.
```
