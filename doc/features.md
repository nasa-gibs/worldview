# Optional Features

Some of these features require CGI scripts to execute on your server. In order for them
to function, make sure your server is configured to allow the execution of
CGI files. Next, enable these features in your configuration file.

## Layer Preview Images

By default during the build process we try to fetch images of layers from our Snapshots application to show as previews in the layer picker component.  However, this will only work for layers that are present in NASA GIBS (Global Imagery Browse Services).  If you are serving your own layers, you will likely wish to disable this feature by setting `"previewSnapshots": false` in `config/default/common/features.json`.

## Natural Events

This feature provides natural events queried by Earth Observatory Natural Event Tracker (EONET) by default. To enable, edit `config/default/common/features.json` and set:

```
"naturalEvents": {
    "host": "[host_url_here]"
}
```

to disable, set:
`"naturalEvents": false`

## Data Download (Smart Handoffs)

This feature allows directing users to [Earthdata Search](https://search.earthdata.nasa.gov/) to download the underlying data for layers. For more information see the [Data Download (Smart Handoffs) docs](./smart_handoffs.md). To enable,
edit `config/default/common/features.json` and set `"smartHandoffs": true`.

## Location Search

This feature uses the [ArcGIS World Geocoding Service](https://developers.arcgis.com/rest/geocode/api-reference/overview-world-geocoding-service.htm) to find addresses based on input text, coordinates, and by clicking a spot on the map. To enable,
edit `config/default/common/features.json` and set `"locationSearch"` object `"url"` to use the ArcGIS request URL used by the [ArcGIS World Geocoding Service](https://developers.arcgis.com/rest/geocode/api-reference/overview-world-geocoding-service.htm).

## URL Shortening

This feature uses
[bit.ly](http://bit.ly) to shorten links. Follow these steps to enable it:

* Edit `config/default/common/features.json` and set `"urlShortening": true`.
* Get a login and API key from [bit.ly](http://bit.ly).
* Create `build/options/bitly.json` with the following contents (replacing `your_login` and `your_key` with the appropriate values);

```json
{
  "login": "your_login",
  "key": "your_key"
}
```

> Caution: Do not commit this file to a public repo, and make sure the `build/options` directory is not publicly accessible on your web server to protect the privacy of your API key.

## Google Tag Manager

Worldview uses the analytics framework [Google Tag Manager](https://developers.google.com/tag-manager) to collect user interface interaction metrics. To use this feature, obtain a Google Tag Manager ID formatted as "GTM-XXXXXX", and add the ID as environment variable `GTM_ID` that can be accessed during the build process to inject your ID into the necessary code. This feature is turned on by default:

```json
"googleTagManager": true
```

to disable this feature, set:
`"googleTagManager": false`
