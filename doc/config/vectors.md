# Configuration

## Table of Contents

* [Overview](configuration.md)
* [Adding New Layers](layers.md)
  * [Vector Layers](vectors.md)
  * [Adding Layers to Layer Picker](product_picker.md)
* [Adding New Tour Stories](tour_stories.md)

---

## Vector Layers

To display a custom vector layer style & legend, a *vectorStyle* property should exist in the layer config with the following properties:

* **id**: Identifier of the vector style. This should match the name of the colormap file without the extension.

## Example

```json
{
  "layers": {
    "OrbitTracks_Aqua_Ascending": {
      "id":       "OrbitTracks_Aqua_Ascending",
      "title":    "Orbit Tracks (Ascending, Points, Aqua)",
      "type":     "vector",
      "group":    "overlays",
      "period": "daily",
      "layergroup": [
        "vector"
      ],
      "vectorStyle": {
        "id": "OrbitTracks_Aqua_Ascending"
      },
    }
  }
}
```

## Creating Custom Vector Styles

Vector layers created from the Global Imagery Browse Services (GIBS) will have a default style.json file associated with the layer defined in the GIBS WMTS GetCapabilities document. The vector style JSON file follows the [mapbox-gl-js style spec](https://docs.mapbox.com/mapbox-gl-js/style-spec/). The layer's default style will be extracted from the GetCapabilities document and assigned to it's associated layer on build.

## Vector Style Example

The following is an example of a basic vector style. This vector layer is referenced in the "source-layer" and has line, point, and label features being styled. Each unique "source" defined within the vector style document will add a new style option to the layer settings panel and can be passed to the layer's style param in the URL. The legend in the layer settings panel will be rendered using the color identified in the style's paint settings (with circle taking precedence over line, polygon and label).

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
