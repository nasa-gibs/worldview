# Configuration

## Table of Contents

* [Overview](configuration.md)
* [Adding New Layers](layers.md)
  * [Vector Layers](vectors.md)
  * [Adding Layers to Layer Picker](product_picker.md)
* [Adding New Tour Stories](tour_stories.md)

---

## Adding New Tour Stories

Create a new JSON document in `config/default/common/config/wv.json/stories/` named `X.json` where `X`
is the story identifier. This file can be placed in any subdirectory as needed for organizational purposes. All properties should be in an object keyed by the story identifier.

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

## Story Order

The `config/default/common/config/wv.json/storyOrder.json` file must be updated to include the new story identifier. This file determines the order that stories are displayed in the overview modal.

## Required Properties

The minimum set of required properties are as follows:

* **id**: The story identifier.
* **title**: Title of the story displayed to the end user. This is displayed in the story overview modal and the story in-progress modal.
* **steps[]**: To display story steps in the in-progress modal an array of step objects should exist with the following properties:
  * **description**: points to a metadata markdown file located in `config/default/common/config/metadata/stories/`_`[story_id]`_`/`
  * **stepLink**: The URL parameters of a linked Worldview instance separated by an `&` symbol (i.e. `p=geographic&t1=2018-12-30`)
  * **transition**: (OPTIONAL) Advanced Configuration. An object containing an **element** and a custom **action**. These transitions occur between changing steps; these require custom code to target the element and an action to action upon that element.
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

## Optional properties:

* **type**: Use `wildfire`, `volcano`, `snow`, `sea-and-lake-ice`, `iceberg`, `water-color`, `dust-and-haze`, `severe-storm`, `man-made` or `critical` to set the display styling of the story. Each story will have a color and icon associated with it's type. If left blank, the story styling will default to dark blue and a world icon.
* **description**: A description of the story displayed to the end user when hovering the story's box on the overview modal.
* **backgroundImage**: The background image shown on the story overview modal. This image should be **396px x 396px**, a JPG/JPEG, GIF or PNG, and optimized in size for the web. If no image is provided, a NASA logo will be shown as a placeholder.
* **backgroundImageHover**: The image shown when hovering over the background image in the story overview modal. This image should be **396px x 396px**, a JPG/JPEG, GIF or PNG, and optimized in size for the web. If no image is provided, no roll-over image will appear.
* **readMoreLinks[]**: To display links for additional reading at the end of story modal, an array of objects should exist with the following properties:
  * **title**: The name of the link being displayed.
  * **link**: The url of the link being displayed.

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

## Joyride Interactive Tour Steps

Tour stories support spotlighting tutorial steps via [React Joyride](https://react-joyride.com/).  Each tour step can include any number of Joyride tour steps which will place a beacon on the target DOM element.  Clicking the beacon will open a tooltip that shows the provided `content`.  Configuration properties are as follows:

* **joyride**: The root object added to the tour step.
  * **continuous**: Boolean.  Should closing a tooltip advance to the next step.
  * **spotlightClicks**:  Boolean.  Should mouse hover/click interactions be allowed within the target DOM element while the tooltip is open.  By default, clicking within this area closes the tooltip.
  * **steps**: The array of Joyride steps for use within this tour step. Each object can have the following properties:
    * **target**: Required.  The DOM selector on which to place the beacon for this step.
    * **targetCoordinates**: Can be used to place a beacon/spotlight on the map itself instead of a DOM element.  This object has two properties, `topLeft` and `bottomRight` which are arrays of coordinates that indicate the bounding area on the map you want to highlight.  If `targetCoordinates` are defined, the `target` property should be set to an id that doesn't exist on the DOM since it will be created temporarily on the fly. (e.g. `#my-map-target1`)
    * **placementBeacon**: Where to place the beacon in relation to the element. (`top`, `bottom`, `left`, `right`)
    * **content**: The content to show within the tooltip that opens when the beacon is clicked.

### Joyride Example:

```json
{
  "stories": {
    "joyride_tour": {
      "id": "joyride_tour",
      "title": "Joyride Tour",
      "steps": [
        {
          "description": "step001.html",
          "stepLink": "...",
          "joyride": {
            "continuous": true,
            "spotlightClicks": true,
            "steps": [
              {
                "target": "#map-target-1",
                "targetCoordinates": {
                  "topLeft": [-79, 29.5],
                  "bottomRight": [-72, 23]
                },
                "content": "Hover over the different colors in the image on the map...",
                "placementBeacon": "top"
              },
              {
                "target": "#GOES-East_ABI_Band13_Clean_Infrared-Clean_Longwave_Infrared_Window_Band_0_legend0colorbar",
                "content": "...to see the corresponding temperature value here.",
                "placementBeacon": "top"
              }
            ]
          }
        }
      ]
    }
  }
}
```

## Adding Stories to Worldview Tour Modals

New stories can be added to the Worldview tour modals via the following:

* Add New Tour Storie(s)
  * Follow steps above to create JSON config file in `config/default/common/config/wv.json/stories/`.
* Add to Story Order
  * Add new story id to `config/default/common/config/wv.json/storyOrder.json`.
* Add story step descriptions/metadata & overview background images
  * Create .md file in `config/default/common/config/metadata/stories/`_`[story_id]`_`/`. The *story_id* folder identifier should be labeled the same as the folder identifier in `config/default/common/config/wv.json/stories/`_`[story_id]`_`/`. Each step defined in the metadata folder will need to correspond to the `description` parameter within that file.
* Rebuild the configuration with `npm run build:config` for use by the application.
