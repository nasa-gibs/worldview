## URL Parameters

### External

| Parameter | Value | Description |
| --------- | ----- | ----------- |
| `map` | `minX`,`minY`,`maxX`,`maxY` | Extent of the map view port in units are based on the projection selected (degrees for EPSG:4326, meters for others) |
| `products` | `baselayers`,`layer1`,`layer2~overlays`,`layer3`,`layer4` | Active layer list where layerX is the identifier of the layer as defined in the configuration file. Any number of layers may be specified in baselayers or overlays. Hidden layers are prefixed with a “!”. Delimiting layers with a “.” is supported but deprecated. |
| `time` | `YYYY-MM-DD` | Selected UTC day. |
| `p` | `geographic`,`arctic`,`antarctic` | Selected projection. |
| `palettes` | `layer1`,`palette1~layer2`,`palette2` | If present, assigns a custom palette to a layer where layerX is the identifier of the layer and paletteX is the identifier of the palette as defined in the configuration file. Any number of layer to palette mappings may be specified. |
| `opacity` | `layer1`,`value1~layer2`,`value2` | (Not officially supported at this time) If present, assigns an opacity value to a layer where layerX is the identifier of the layer as defined in the configuration file, and valueX is a real number in the range of 0 to 1 where 0 is fully transparent and 1 is fully opaque. Any number of layer to opacity value mappings may be specified. |
| `dataDownload` | product identifier | If set, activates the data download tab and selects the product. |

### Internal

| Parameter | Value | Description |
| --------- | ----- | ----------- |
| epsg | `4326` (geographic), `3413` (arctic), `3031` (antarctic) | EPSG code for the selected projection |

For additional debugging parameters, see: [Testing/Debug Parameters](testing.md)