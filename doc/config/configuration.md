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

To create a custom configuration simply copy the `config/default` directory to `config/active` and modify it's contents as needed. Any configuration found in here will be used instead of `config/default`.

To quickly switch between different configurations, use a symlink for `config/active`

## Updating the Configuration

After making any changes to configuration files, rebuild the app for the changes to take effect.
Use the `npm run build` command to make a request to [the GIBS GetCapabilities API](https://wiki.earthdata.nasa.gov/display/GIBS/GIBS+API+for+Developers) to update layer configurations and rebuild the
configuration file used by the application. After a successful build, this file can be found at: `build/options/config/wv.json`

If you want to only rebuild `wv.json`, using GetCapabilities files that were previously requested,
(e.g. if you are just modifying some configs locally and want to test your changes)
you can simply run `npm run build:config`

### Subdirectories

If you have a custom configuration in a subdirectory of `config/` other than
`config/release/`, pass in the name of the subdirectory to use like so:

```bash
CONFIG_ENV=subdirectory_name npm run build:config
```

### Ignoring Build Errors

To build an incomplete configuration, ignoring build errors, prefix the command like this:

```bash
IGNORE_ERRORS=true npm run build:config
```

---

## New Map Sources

Modify the [`sources.json`](../../config/default/release/config/sources.json) file. Within this file there is a *sources*
object that contains an object for each map source keyed by the source identifier.
For layers that can be configured via a GIBS WMTS GetCapabilities document or
for WMS layers, the only property required is `url`

* **url**: Either a string or array of strings where the map service is found.
* **matrixSets**: Only required for WMTS layers that cannot be configured with a GetCapabilities document. An
object that contains an object for each matrix set, keyed by the matrix set identifier.
  * **id**: The identifier for this matrix set.
  * **resolutions**: Array of resolutions for each zoom level.
  * **tileSize**: Array of pixel dimensions for each tile. Example; `[512, 512]`

### Example sources.json

[`config/default/common/config/wv.json/sources.json`](../../config/default/release/config/sources.json)

```json
{
  "sources": {
    "GIBS:arctic": {
      "url": "https://gibs-{a-c}.earthdata.nasa.gov/wmts/epsg3413/best/wmts.cgi",
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
document, modify the [`config.json`](../../config/default/release/config.json) file and add an object to the
`wv-options-fetch` array with the following properties:

* **from**: The URL to fetch the GetCapabilities document
* **to**: Name of the temporary file used to store the GetCapabilities document.

Now add an object to the `wv-options-wmts` array with the following properties:

* **source**: The identifier of the source that corresponds to this endpoint.
* **from**: The name of the temporary file used int he `wv-options-fetch` object.
* **to**: The name of the temporary output JSON file.
* **projection**: The identifier of the projection used in this endpoint (see `config/default/common/config/wv.json/projections`)
* **maxResolution**: The resolution of first tile matrix entry.

### Example config.json

[`config/default/release/config.json`](../../config/default/release/config.json)

```json
{
  "wv-options-fetch": [
    {
      "from": "https://gibs.earthdata.nasa.gov/wmts/epsg4326/best/wmts.cgi?request=GetCapabilities",
      "to": "gibs-geographic.xml"
    }
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
