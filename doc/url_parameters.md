# URL Parameters

| Parameter | Type | Value | Description |
| --------- | ---- | ----- | ----------- |
| `p` | string | <b>`geographic`</b>, <b>`arctic`</b> or **antarctic** | Selected projection. |
| `v` | string | *`minX,minY,maxX,maxY`* | Extent of the map viewport in units based on the projection selected (degrees for geographic, meters for others). |
| `l` (`l1` for B state) | string | *`layer_id1,layer_id2,..,layer_idN`* | Active layer list where `layer_id` is the identifier of the layer as defined in the configuration file. Any number of baselayers or overlays may be specified (separated by a `,`). |
|  | boolean | *`layer_id(`**`hidden`**`)`* | If present, this layer will appear in the layer list but not shown on the map. |
|  | string | *`layer_id(`**`opacity`**`=value)`* | If present, assigns an opacity value to a layer where `layer_id` is the identifier of the layer, as defined in the configuration file, and `value` is a real number in the range of 0 to 1 where 0 is fully transparent and 1 is fully opaque. Any number of layer to opacity value mappings may be specified. |
|  | string | *`layer_id(`**`palettes`**`=value1,value2,..,valueN)`* | If `palettes` is present, a custom palette will be assigned to a raster layer where `layer_id` is the identifier of the layer and `value` is the identifier of the palette, as defined in the configuration file. Any number of raster layer to palette mappings may be specified. |
|  | string | *`layer_id(`**`squash`**`)`* | If `squash` is present and a `min` or `max` value is set, the palette will start or end at the designated min/max values and the palette will adjust to these bounds. |
|  | string | *`layer_id(`**`min`**`=value1,value2)`* | If `min` is present, the raster layer `palettes` will start at the defined value. This value can be paired with `max` and `squash` to customize the entire palette range. |
|  | string | *`layer_id(`**`max`**`=value1,value2)`* | If `max` is present, the raster layer `palettes` will end at the defined value. This value can be paired with `min` and `squash` to customize the entire palette range. |
|  | string | *`layer_id(`**`style`**`=value)`* | If `style` is present, a custom vector style, will be assigned to a vector layer where `layer_id` is the identifier of the layer and `value` is the identifier of the vector style, as defined in the configuration file. |
| `lg` (`lg1` for B state) | boolean | <i>`true`</i> or <i>`false`</i> | If `false`, layers are not grouped. If this parameter is absent, it is considered `true` and layers will be grouped |
| `t` (`t1` for B state) | date | *`YYYY-MM-DD-Thh:mm:ssZ`* | Selected UTC day and time.\*\* |
| `z` | number | <b>`1`</b> to <b>`5`</b> | The timescale axis zoom value from 1 to 5.\* |
| `i` | number | <b>`1`</b> to <b>`5`</b> | The timeline interval value from 1 to 5.\* |
| `ics` | boolean | <i>`true`</i> or <i>`false`</i> | If `custom selected` is `true`, a `custom interval` and `custom delta` will be active and allow custom intervals in time changes. |
| `ici` | number | <b>`1`</b> to <b>`5`</b> | The `custom interval` value from 1 to 5\* identifies which time unit is changed by the date change arrows and optionally animation. *\*Only active and saved in url if `custom selected` is true.* |
| `icd` | number | <b>`1`</b> to <b>`999`</b> | The `custom delta` value for how many `custom interval` time units are added or subtracted when using the date change arrows and optionally animation. *\*Only active and saved in url if `custom selected` is true.* |
| `e` | string,date | *`event_id,yyyy-mm-dd`* | If any value is present, the events tab will be activated. If the value is a valid event\_id, the corresponding event will be highlighted in the event list. If a date (YYYY-MM-DD) is added to the event\_id, then the selected event for the specified date will be shown. |
| `efs` | boolean | <i>`true`</i> or <i>`false`</i> | Determines whether to "show all" events that match the date range and category filters or, to also include the current map viewport bounding box in the event API call to limit results to that area.<br><br>Default: `true` (which means show all; no bbox included) |
| `efd` | string | `yyyy-mm-dd,yyyy-mm-dd` | The event start and end dates to be included in an event API request. Default range is last 120 days from current app load time. |
| `efc` | string | `id,id,id` | The event category ids for each category to be included in an event API request. |
| `s` | string | *`coordinates`* | A pair of coordinates using Decimal Degrees format (`DDD.DDDD,DDD.DDDD`) to add a Location Search marker onto the map. To add more than one Location Search marker, separate coordinate pairs with a plus symbol. (`DDD.DDDD,DDD.DDDD+DDD.DDDD,DDD.DDDD`)|
| `ab` | boolean | **`on`** | If set to "on", the animation widget will be shown. |
| `aa` | boolean | **`false`** | If set to "true", the animation will play on load. NOTE: The URL also requires valid animation parameters (ab, av, etc.). |
| `as` | date | *`YYYY-MM-DDThh:mm:ssZ`* | The animation start day & time.\*\* |
| `ae` | date | *`YYYY-MM-DDThh:mm:ssZ`* | The animation end day & time.\*\* |
| `av` | number | <b>`1`</b> to <b>`10`</b> | The animation speed value from 1 to 10. 1 = slowest, 10 = fastest. |
| `al` | boolean | <i>`true`</i> or <i>`false`</i> | If any value is set, the animation loop will be turned on. Animation looping is disabled by default. |
| `ca` | boolean | <i>`true`</i> or <i>`false`</i> | Determines if the A or B state is active. If this parameter exists at all, compare mode will be active. If `ca=true`, Compare mode will be active in the A state. |
| `cm`                 | string      | _`swipe`_ , _`spy`_ or _`opacity`_                     | If comparison mode is active (`ca=true\|false`) the `cm` parameter will determine which comparison mode to use. Default mode is `swipe`.                                                                                                                                                                        |
| `cv`                 | Number      | **`0`** to **`100`**                                   | If `ca='true\|false'`, The `cv` parameter is used to determine the location of the swiper or the value of opacity depending on the selected mode. Default is `50` which will place the swiper on the middle of any screen. This parameter is irrelevant when the `spy` mode is active (`cm=spy`).                |
| `download` | string | *`product_id`* | If any value is set, the data download tab will be activated. If a product identifier is set, the corresponding will be selected. |
| `r` | number | <b>`-180.0000`</b> to <b>`180.0000`</b> | The degree of map rotation. Only applies when `arctic` or `antarctic` projection is selected. |
| `df` | boolean | <i>`true`</i> or <i>`false`</i> | If `true` value is set, distraction free mode will be activated. Distraction free mode is disabled by default and can be toggled from the Information toolbar menu. |
| `em` | boolean | <i>`true`</i> or <i>`false`</i> | If `true` value is set, embed mode will be activated. Embed mode is disabled by default. |
| `tr` | string | *`tour_id`* | The id of the tour story to load. Stories will load from step 1. |
| `abt` | string | *`on`* | Indicates whether the about modal is open or not. Allows for permalinks that have the about page open |

\* *1 = yearly, 2 = monthly, 3 = daily, 4 = hourly, and 5 = minutely. The subdaily zoom levels (4 & 5) will only be available when subdaily layers are active.*

\*\* *Time fields will only be shown when subdaily layers are active.*

For debugging with URL parameters, see: [Testing / Debug Parameters](testing.md#debug-parameters)