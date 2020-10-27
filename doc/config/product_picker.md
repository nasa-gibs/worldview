# Configuration

## Table of Contents

* [Overview](configuration.md)
* [Adding New Layers](layers.md)
  * [Vector Layers](vectors.md)
  * [Adding Layers to Layer Picker](product_picker.md)
* [Adding New Tour Stories](tour_stories.md)

---

## Adding Layers to the Layer Picker

Newly added layers require some additional steps and configuration in order to properly display throughout the layer picker UI.

* Add new layer config(s)
  * Follow [New Layers](layers.md) steps to create JSON file in `config/default/common/config/wv.json/layers`.
* Add to Measurements
  * Add to relevant measurement or create a new measurement JSON file in `config/default/common/config/wv.json/measurements`.
* Add to Categories
  * Add to relevant category or create a new category JSON file in `config/default/common/config/wv.json/categories`.
* Add to Layer Order
  * Add to `config/default/common/config/wv.json/layerOrder.json`.
* Add layer to Image Download
  * *Worldview Snapshots Team adds layers to Image Download*
* Add Layer descriptions/metadata, if it exists
  * Create .md file in `config/default/common/config/metadata`. The *description* (i.e. layer description/metadata) identifier has to be added to the corresponding measurement JSON file.
* Add Data Download for product, if it exists
  * Refer to [Data Download](../data_download.md) and create JSON file in `config/default/common/config/wv.json/products`. The *product* identifier has to be added to the corresponding layer JSON file.
* Rebuild the configuration with `npm run build` for use by the application.

## Adding New Categories

![Layer categories and measurements](categories.jpg?raw=true)

Within the layer picker layers are grouped by categories and measurements.  Categories are grouped by a category group.  Measurements are grouped by, and can belong to more than one, category.

In the image above we see that three top-level category groups are: `hazards and disasters`, `science disciplines`, and `featured`.  For each category group a tab is shown in the layer picker.  The `recent` tab is not a category group per-se and is always visible.

Within the `hazards and disasters` tab we can also see the first three categories in this group: `All`, `Air Quality`, and `Ash Plumes`.  Finally, within each of these categories we can see the first six measurements within that category.

### Category Group Order

The names of each category group, which are treated as unique identifiers and referenced in each category config, should be placed in the file `config/default/common/config/wv.json/categoryGroupOrder.json`.  This allows setting the order of the category group tabs within the layer picker.  If a category group is referenced in a category config, it **must also be defined here**.

```json
{
  "categoryGroupOrder": [
    "hazards and disasters",
    "science disciplines",
    "featured"
  ]
}
```

### Category Config Example

`config/default/common/config/wv.json/categories/hazards_and_disasters/Air Quality.json`
```json
{
    "categories": {
        "hazards and disasters": {
            "Air Quality": {
                "title": "Air Quality",
                "id": "air-quality",
                "image": "air-quality.jpg",
                "description": "",
                "measurements": [
                    "Aerosol Index",
                    "Aerosol Optical Depth",
                    "Carbon Monoxide",
                    ...
                ]
            }
        }
    }
}
```


## Adding New Measurements

When a category is selected in the layer picker, the view transitions to the measurements list view seen in the image below. Within a measurement (e.g. `Aerosol Index`) the layers are further grouped by `sources`.

![Layer categories and measurements](measurements.jpg?raw=true)

In the measurement config example below, we can see the layer ids for each layer that belongs to a `source` is placed within the `settings` array for that source.

### Measurement Config Example
`config/default/common/config/wv.json/measurements/Aerosol Index.json`
```json
{
    "measurements": {
        "Aerosol Index": {
            "id": "aerosol-index",
            "title":    "Aerosol Index",
            "subtitle": "Aura/OMI, Suomi NPP/OMPS",
            "sources": {
                "Aura/OMI": {
                    "id": "aura-omi",
                    "title": "Aura/OMI",
                    "description": "omi/AerosolIndex",
                    "image": "",
                    "settings": [
                        "OMI_Aerosol_Index",
                        "OMI_UV_Aerosol_Index",
                        "OrbitTracks_Aura_Ascending"
                    ]
                },
                "Suomi NPP/OMPS": {
                    "id": "suomi-npp-omps",
                    "title": "Suomi NPP/OMPS",
                    "description": "omps/AerosolIndex",
                    "image": "",
                    "settings": [
                        "OMPS_Aerosol_Index",
                        "OMPS_Aerosol_Index_PyroCumuloNimbus",
                        "OrbitTracks_Suomi_NPP_Ascending"
                    ]
                }
            }
        }
    }
}
```
