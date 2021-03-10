## Description

Fixes #

[Ids of the layers being added]

- [ ] Included layer(s) were added to the `layer-order.json`
- [ ] Included layer(s) have an appropriate `layergroup` defined
- [ ] Included layer(s) were added the appropriate measurements
- [ ] Included layer(s) have a corresponding preview image
- [ ] Included layer(s) have the necessary visualization metadata configs in GIBS
- [ ] The corresponding concept ids in the visualization metadata configs are valid and return a collection when requested from CMR (e.g. `https://cmr.earthdata.nasa.gov/search/concepts/<concept-id>.html`)

## How To Test

- Do the dates show properly in the layer details both when viewed from the sidebar and in the layer description when browsing?
- Do the dates in the description match with what appears available when adjusting the timeline?
- Do the layers properly group with other layers in the same `layergroup`?
- Do the layers show in the right category/measurement when browsing?
- Do the preview images for the layers look right when searching in the product picker?
- Does data download work properly (if concept id present)?

## PR Submission Checklist

This is simply a reminder of what we are going to look for before merging your code.

- I have read the [CONTRIBUTING](https://github.com/nasa-gibs/worldview/blob/master/.github/CONTRIBUTING.md) doc
- I have added necessary documentation (if applicable)
- I have added tests that prove my fix is effective or that my feature works (if applicable)
- Any dependent changes have been merged and published in downstream modules (if applicable)

@nasa-gibs/worldview
