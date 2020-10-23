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

## Adding New Measurements