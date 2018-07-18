# URL Parameters

| Parameter | Value | Description |
| --------- | ----- | ----------- |
| `p` | `geographic`, `arctic`, `antarctic` | Selected projection. |
| `v` | `minX,minY,maxX,maxY` | Extent of the map viewport in units based on the projection selected (degrees for EPSG:4326, meters for others). |
| `l` | `layer_id1,layer_id2,layer_id3` | Active layer list where `layer_id` is the identifier of the layer as defined in the configuration file. Any number of baselayers or overlays may be specified (separated by a `,`). |
| `hidden` | `[layer_id](hidden)` | If present, toggles the visibility of the layer as identified by the `layer_id` in the configuration file. |
| `opacity` | `[layer_id](opacity=valueX)` | If present, assigns an opacity value to a layer where `layer_id` is the identifier of the layer, as defined in the configuration file, and `valueX` is a real number in the range of 0 to 1 where 0 is fully transparent and 1 is fully opaque. Any number of layer to opacity value mappings may be specified. |
| `palettes` | `[layer_id](palette=valueX)` | If present, assigns a custom palette to a layer where `layer_id` is the identifier of the layer and `valueX` is the identifier of the palette, as defined in the configuration file. Any number of layer to palette mappings may be specified. |
| `t` | `YYYY-MM-DD-Thh:mm:ssZ` | Selected UTC day and time.  _*Time fields will only be shown when subdaily layers are active._ |
| `z` | `1`, `2`, `3`, `4` | The zoom value from 1 to 4. 1 = yearly, 2 = monthly, 3 = daily, 4 = subdaily. _*The subdaily zoom level will only be available when subdaily layers are active._ |
| `e` | `event_id,yyyy-mm-dd` | If any value is present, the events tab will be activated. If the value is a valid event_id, the corresponding event will be highlighted in the event list. If a date (YYYY-MM-DD) is added to the event_id, then the selected event for the specified date will be shown. |
| `ab` | `on` | If set to "on", the animation widget will be shown. |
| `as` | `YYYY-MM-DDThh:mm:ssZ` | The animation start day & time. _*Time fields will only be shown when subdaily layers are active._ |
| `ae` | `YYYY-MM-DDThh:mm:ssZ` | The animation end day & time _*Time fields will only be shown when subdaily layers are active._ |
| `av` | `1` to `10` | The animation speed value from 1 to 10. 1 = slowest, 10 = fastest. |
| `al` | `true` | If a value is set, the animation loop will be turned on. Animation looping is disabled by default. |
| `download` | `[product_id]` | If any value is set, the data download tab will be activated. If a product identifier is set, the corresponding will be selected. |
| `r` | `-180.0000` to `180.0000` | The degree of map rotation. Only applies when `arctic` or `antarctic` projection is selected. |

For debugging with URL parameters, see: [Testing / Debug Parameters](testing.md#debug-parameters)