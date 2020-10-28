# Configuration

## Table of Contents

* [Overview](configuration.md)
* [Adding New Layers](layers.md)
  * [Vector Layers](vectors.md)
  * [Adding Layers to Layer Picker](product_picker.md)
* [Adding New Tour Stories](tour_stories.md)

---

## Overview

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

After making any changes to a custom configuration, rebuild the app for thechanges to take effect.
Use the `npm run build` command to make a request to [the GIBS GetCapabilities API](https://wiki.earthdata.nasa.gov/display/GIBS/GIBS+API+for+Developers) to update layer configurations and rebuild the
configuration file `wv.json` used by the application.

If you just want to rebuild `wv.json` based on the last GetCapabilities files that were pulled,
for example if you are modifying configs locally and want to see/test your changes,
you can simply run `npm run build:config`

### Subdirectories

If you have a custom configuration in a subdirectory of `config/` other than
`config/release/`, pass in the name of the subdirectory to use with
`CONFIG_ENV=subdirectory_name npm run build:config`.
To build an incomplete configuration, prefix the command like this: `IGNORE_ERRORS=true npm run build:config`.

---

## New Map Sources

Modify the JSON document, `config/default/common/config/wv.json/sources.json`. There is a *sources*
object that contains an object for each map source keyed by the source identifier.
For layers that can be configured via a GIBS WMTS GetCapabilities document or
for WMS layers, the only property required is:

* **url**: Either a string or array of strings where the map service is found.

For WMTS layers that cannot be configured with a GetCapabilities document, a
*matrixSets* object must exist that contains an object for each matrix set,
keyed by the matrix set identifier.

* **id**: The identifier for this matrix set.
* **maxResolution**: The maximum resolution of this of this matrix tile set as defined in the [OpenLayers 2 documentation](http://dev.openlayers.org/docs/files/OpenLayers/Layer-js.html#OpenLayers.Layer.maxResolution). This property might be deprecated in the future as it can be obtained from the *resolutions* property.
* **resolutions**: Array of resolutions for each zoom level as defined in the [OpenLayers 2 documentation](http://dev.openlayers.org/docs/files/OpenLayers/Layer-js.html#OpenLayers.Layer.maxResolution).
* **tileSize**: Array of pixel dimensions for each tile. Example; `[512, 512]`

### Example sources.json

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

---

## GetCapabilities

To automatically fetch configuration information from the GetCapabilities
document, modify the `config/default/release/config.json` file and add an object to the
`wv-options-fetch` object with the following properties:

* **from**: The URL to fetch the GetCapabilities document
* **to**: Name of the temporary file used to store the GetCapabilities document.

Now add an object to the `wv-options-wmts` object with the following properties:

* **source**: The identifier of the source that corresponds to this endpoint.
* **from**: The name of the temporary file used int he `wv-options-fetch` object.
* **to**: The name of the temporary output JSON file.
* **projection**: The identifier of the projection used in this endpoint (see `config/default/common/config/wv.json/projections`)
* **maxResolution**: The resolution of first tile matrix entry.

### Example config.json

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
