# Changelog

## [v3.9.2](https://github.com/nasa-gibs/worldview/tree/v3.9.2) (2021-04-13)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/main...release-3.9.2)

## Implemented Enhancements:

- Add 15m OSM Reference [\#886](https://github.com/nasa-gibs/worldview/issues/886)

## Merged PRs:

- Add 15m OSM reference layers [\#3443](https://github.com/nasa-gibs/worldview/pull/3443)

## [v3.9.1-rc1](https://github.com/nasa-gibs/worldview/tree/v3.9.1-rc1) (2021-04-06)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.9.1...v3.9.1-rc1)

## [v3.9.1](https://github.com/nasa-gibs/worldview/tree/v3.9.1) (2021-04-06)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.9.0...v3.9.1)

## Implemented Enhancements:

- Update PR doc template to include testing [\#2968](https://github.com/nasa-gibs/worldview/issues/2968)

## Closed Issues:

- update dates for Clear Sky confidence layers [\#3424](https://github.com/nasa-gibs/worldview/issues/3424)
- Renaming of default branch to `main` [\#3316](https://github.com/nasa-gibs/worldview/issues/3316)

## Merged PRs:

- Update dockerfile [\#3447](https://github.com/nasa-gibs/worldview/pull/3447)

## [v3.9.0](https://github.com/nasa-gibs/worldview/tree/v3.9.0) (2021-03-02)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.9.0-rc4...v3.9.0)

## Implemented Enhancements:

- Remove TOPEX-Poseidon\_JASON\_Sea\_Surface\_Height\_Anomalies\_GDR\_Cycles [\#3371](https://github.com/nasa-gibs/worldview/issues/3371)
- Update SMAP SSS CAP Products [\#3368](https://github.com/nasa-gibs/worldview/issues/3368)
- Add VIIRS ClearSky/CYGNSS WS SDR [\#3367](https://github.com/nasa-gibs/worldview/issues/3367)
- Added AMSR-E SM STD L2/v11 new products. [\#3358](https://github.com/nasa-gibs/worldview/issues/3358)
- Stop animation action called when opening product picker if animation isn't playing [\#3311](https://github.com/nasa-gibs/worldview/issues/3311)
- JSON Schema validation for layer configs [\#3291](https://github.com/nasa-gibs/worldview/issues/3291)
- Added ISS/LIS FC and RAD QC [\#3285](https://github.com/nasa-gibs/worldview/issues/3285)
- Allow flexible categories naming for product picker layers [\#3282](https://github.com/nasa-gibs/worldview/issues/3282)
- Update IE detection and unsupported page [\#3262](https://github.com/nasa-gibs/worldview/issues/3262)
- Add current date to URL if any other parameters are changed [\#3242](https://github.com/nasa-gibs/worldview/issues/3242)
- Add Smart handoffs GTM event triggers [\#3238](https://github.com/nasa-gibs/worldview/issues/3238)
- Replace uglify-js with terser for webpack optimization minimizer [\#3234](https://github.com/nasa-gibs/worldview/issues/3234)
- Replaced old CYGNSS layer with updated CDR CYGNSS layer - Best endpoint remains the same [\#3222](https://github.com/nasa-gibs/worldview/issues/3222)
- Update repository GIF preview image and related screenshots for UI changes v3.9.0 [\#3215](https://github.com/nasa-gibs/worldview/issues/3215)
- Remove use of mouse hover/move Redux actions  [\#3194](https://github.com/nasa-gibs/worldview/issues/3194)
- Remove unused references to ownProps [\#3192](https://github.com/nasa-gibs/worldview/issues/3192)
- Add data panel info hover tooltip in header [\#3170](https://github.com/nasa-gibs/worldview/issues/3170)
- Break up configuration.md file into smaller files [\#3166](https://github.com/nasa-gibs/worldview/issues/3166)
- Fully integrate futureLayers into the app [\#3162](https://github.com/nasa-gibs/worldview/issues/3162)
- Remove jQuery, jQuery-UI dependencies [\#3161](https://github.com/nasa-gibs/worldview/issues/3161)
- Remove map zoom buttons in mobile [\#3156](https://github.com/nasa-gibs/worldview/issues/3156)
- Category groups should be less hard-coded, more config-based [\#3130](https://github.com/nasa-gibs/worldview/issues/3130)
- Remove deprecated polyfill.js [\#3108](https://github.com/nasa-gibs/worldview/issues/3108)
- Better notifications for layer problems/outages [\#3066](https://github.com/nasa-gibs/worldview/issues/3066)
- Copy coordinates to clipboard [\#3032](https://github.com/nasa-gibs/worldview/issues/3032)
- Added AMSRU2 Sea Ice vR04 NRT [\#2984](https://github.com/nasa-gibs/worldview/issues/2984)
- Allow disable/enable all for toggling classifications [\#2931](https://github.com/nasa-gibs/worldview/issues/2931)
- Migrate to EONET V3 [\#2634](https://github.com/nasa-gibs/worldview/issues/2634)
- Provide method in layer config to override GC ISO8601 durations [\#2617](https://github.com/nasa-gibs/worldview/issues/2617)
- Icons should have hover tooltips & aria labels for accessibility [\#2564](https://github.com/nasa-gibs/worldview/issues/2564)
- Optimize date request within animation for layers that don't require multiple requests [\#2435](https://github.com/nasa-gibs/worldview/issues/2435)
- Provide ability to filter events by type [\#2057](https://github.com/nasa-gibs/worldview/issues/2057)
- Epic - Gazetteer / Omni Search [\#1688](https://github.com/nasa-gibs/worldview/issues/1688)

## Technical Updates / Bugfixes:

- Error thrown on changing date on tour step  [\#3392](https://github.com/nasa-gibs/worldview/issues/3392)
- Can't advance days in tour story when changing to a custom interval [\#3389](https://github.com/nasa-gibs/worldview/issues/3389)
- Smart handoffs should not show entries for layers with invalid concept ids [\#3373](https://github.com/nasa-gibs/worldview/issues/3373)
- perm.in.layers.8, perm.in.pal.1, etc: Layer panel is mostly transparent on iPad [\#3370](https://github.com/nasa-gibs/worldview/issues/3370)
- geosearch.permalink.1: Map marker is not on map [\#3362](https://github.com/nasa-gibs/worldview/issues/3362)
- In mobile view, event list does not show selected event after selection [\#3361](https://github.com/nasa-gibs/worldview/issues/3361)
- Matching coverage not updating to correct matching coverage in timeline  [\#3360](https://github.com/nasa-gibs/worldview/issues/3360)
- Hovering over timescale change prevents hiding map scale in distraction free mode [\#3357](https://github.com/nasa-gibs/worldview/issues/3357)
- Animation does not stop playing when you change the projection [\#3347](https://github.com/nasa-gibs/worldview/issues/3347)
- Trying to Download image with HLS grid active returns an error [\#3343](https://github.com/nasa-gibs/worldview/issues/3343)
- Map won't drag after removing/re-adding layers in Compare mode  [\#3341](https://github.com/nasa-gibs/worldview/issues/3341)
- Tour steps modal is squashed on iPad [\#3340](https://github.com/nasa-gibs/worldview/issues/3340)
- Vector layers with too many points can crash the browser \(iPad\) [\#3339](https://github.com/nasa-gibs/worldview/issues/3339)
- Can't drag to move vector modal \(iPad\) [\#3338](https://github.com/nasa-gibs/worldview/issues/3338)
- Animation panel buttons unresponsive to touch event \(iPad\) [\#3337](https://github.com/nasa-gibs/worldview/issues/3337)
- Geosearch marker/measurement tooltips hard to close \(iPad\) [\#3336](https://github.com/nasa-gibs/worldview/issues/3336)
- Smart handoff URL should not include date range for non-temporal layers [\#3334](https://github.com/nasa-gibs/worldview/issues/3334)
- Can't click on zots or settings buttons in layer list in landscape mode on iPad [\#3331](https://github.com/nasa-gibs/worldview/issues/3331)
- events.notfocus.4 - When switching projections from previously selected event, it is no longer at the top of the list  [\#3326](https://github.com/nasa-gibs/worldview/issues/3326)
- layer.mob.init.12 - Upper portion of text slightly obscured in facets in mobile view [\#3325](https://github.com/nasa-gibs/worldview/issues/3325)
- Zoom buttons not visible [\#3324](https://github.com/nasa-gibs/worldview/issues/3324)
- perm.in.anim.2 & date.animation.3 - animation doesn't load the last time step on map [\#3323](https://github.com/nasa-gibs/worldview/issues/3323)
- perm.in.layers.3 - URL returns an unexpected error [\#3322](https://github.com/nasa-gibs/worldview/issues/3322)
- Change color of Squash palette text [\#3321](https://github.com/nasa-gibs/worldview/issues/3321)
- Geosearch place map marker - Right click doesn't cancel [\#3318](https://github.com/nasa-gibs/worldview/issues/3318)
- Blue hyperlinks are harder to read  [\#3317](https://github.com/nasa-gibs/worldview/issues/3317)
- Cursors incorrect [\#3309](https://github.com/nasa-gibs/worldview/issues/3309)
- Desktop only modal is overlaying in mobile and preventing interaction [\#3307](https://github.com/nasa-gibs/worldview/issues/3307)
- Tooltip date range incorrect [\#3299](https://github.com/nasa-gibs/worldview/issues/3299)
- Warning on mouseover of HLS\_MGRS\_Granule\_Grid related to palette [\#3297](https://github.com/nasa-gibs/worldview/issues/3297)
- Console warning when adding layers in product picker [\#3293](https://github.com/nasa-gibs/worldview/issues/3293)
- Clicking More Stories at end of tour causes unexpected error [\#3278](https://github.com/nasa-gibs/worldview/issues/3278)
- Preview image for og:image is not present [\#3244](https://github.com/nasa-gibs/worldview/issues/3244)
- Distraction free mode not firing for Geosearch [\#3240](https://github.com/nasa-gibs/worldview/issues/3240)
- When trying to click on a hyperlink in the layer-notice box, the box disappears [\#3229](https://github.com/nasa-gibs/worldview/issues/3229)
- Events mobile hides sidebar Layers/Events tabs after selecting event [\#3223](https://github.com/nasa-gibs/worldview/issues/3223)
- Share e2e test fails regularly on UTC day crossover [\#3211](https://github.com/nasa-gibs/worldview/issues/3211)
- undefined in sources facet doesn't display anything [\#3210](https://github.com/nasa-gibs/worldview/issues/3210)
- Sources Facet with copyright sign does not display correctly [\#3209](https://github.com/nasa-gibs/worldview/issues/3209)
- Trying to view the description for certain orbit track layers throws an error [\#3206](https://github.com/nasa-gibs/worldview/issues/3206)
- Dateline is missing at certain zoom levels [\#3187](https://github.com/nasa-gibs/worldview/issues/3187)
- Permalinks with closed EONET events should show an alert [\#3186](https://github.com/nasa-gibs/worldview/issues/3186)
- Orbit tracks aren't showing on the left wing when zoomed out [\#3177](https://github.com/nasa-gibs/worldview/issues/3177)
- Periods in layer ids break the UI \(again\) [\#3167](https://github.com/nasa-gibs/worldview/issues/3167)
- Data panel incorrect date ranges on some updates [\#3163](https://github.com/nasa-gibs/worldview/issues/3163)
- Notification e2e test breaking intermittently  [\#3159](https://github.com/nasa-gibs/worldview/issues/3159)
- "Error loading metadata" message shows when no error has occurred [\#3136](https://github.com/nasa-gibs/worldview/issues/3136)
- Can't add layers when configured projections don't match those in local storage recent layers object [\#3133](https://github.com/nasa-gibs/worldview/issues/3133)
- Mobile date picker buttons highlight misaligned [\#3119](https://github.com/nasa-gibs/worldview/issues/3119)
- Black Marble config should set wrapx: true [\#3114](https://github.com/nasa-gibs/worldview/issues/3114)
- Initial click of "Shorten Link" returns "Link cannot be shortened at this time" [\#3107](https://github.com/nasa-gibs/worldview/issues/3107)
- Custom palette revert to original intermittently breaks for snapshots [\#3098](https://github.com/nasa-gibs/worldview/issues/3098)
- Style bug -- A | B opacity compare [\#3035](https://github.com/nasa-gibs/worldview/issues/3035)
- When switching from events in Geographic to Antarctic, the map goes blank [\#2865](https://github.com/nasa-gibs/worldview/issues/2865)
- Zero and 1 value displays differently depending on palette for Probabilities for Urban Expansion [\#2716](https://github.com/nasa-gibs/worldview/issues/2716)

## Layer Changes:

- Update AIRS L3 filenames and conceptIDs [\#3276](https://github.com/nasa-gibs/worldview/issues/3276)
- Update AIRS L2 conceptIDs [\#3275](https://github.com/nasa-gibs/worldview/issues/3275)
- Add MAIAC descriptions [\#3270](https://github.com/nasa-gibs/worldview/issues/3270)
- Add conceptID for new VIIRS At Sensor Radiance DNB layer [\#3269](https://github.com/nasa-gibs/worldview/issues/3269)
- Adding VIIRS Fusion v1.0 STD products [\#3196](https://github.com/nasa-gibs/worldview/issues/3196)
- Remove inactive:true for 2 RSS layers [\#3169](https://github.com/nasa-gibs/worldview/issues/3169)
- Update IMERG description [\#3132](https://github.com/nasa-gibs/worldview/issues/3132)
- AIRS L2 NRT v7 version upgrade [\#3129](https://github.com/nasa-gibs/worldview/issues/3129)
- Add Chlorophyll a descriptions [\#3128](https://github.com/nasa-gibs/worldview/issues/3128)

## Closed Issues:

- Update text in Layer Download Availability box [\#3332](https://github.com/nasa-gibs/worldview/issues/3332)
- Determine daynight flag approach for smart handoffs [\#3289](https://github.com/nasa-gibs/worldview/issues/3289)
- Update vis metadata config concept ids [\#3271](https://github.com/nasa-gibs/worldview/issues/3271)
- Update data download page [\#3267](https://github.com/nasa-gibs/worldview/issues/3267)
- Update ASDC related config links [\#3263](https://github.com/nasa-gibs/worldview/issues/3263)
- Investigate grouping of related layers \(e.g. all OSM layers in one "group"\) [\#3185](https://github.com/nasa-gibs/worldview/issues/3185)
- Colormap Legend units aren't at the end of the colorbar on mobile [\#3125](https://github.com/nasa-gibs/worldview/issues/3125)
- Event list doesn't always scroll to the listing in the Events tab [\#3122](https://github.com/nasa-gibs/worldview/issues/3122)
- Organize events by latest date [\#3121](https://github.com/nasa-gibs/worldview/issues/3121)
- Reverse AMSU-A and satellite order [\#3116](https://github.com/nasa-gibs/worldview/issues/3116)
- Add spotlight/pointing capability to tours [\#3075](https://github.com/nasa-gibs/worldview/issues/3075)
- Include ability to add marker/pin by entering specific lat/long coordinates [\#97](https://github.com/nasa-gibs/worldview/issues/97)

## Merged PRs:

- Release 3.9.0 =\> master [\#3388](https://github.com/nasa-gibs/worldview/pull/3388)
- Fix tour step with custom palette issues [\#3395](https://github.com/nasa-gibs/worldview/pull/3395)
- Reset custom interval selector on tour step change without interval, or if delta is 1 [\#3393](https://github.com/nasa-gibs/worldview/pull/3393)
- new preview image with HLS imagery [\#3383](https://github.com/nasa-gibs/worldview/pull/3383)
- Limit splitting of orbit tracks image download processing to KMZ only [\#3382](https://github.com/nasa-gibs/worldview/pull/3382)
- Handle splitting orbit track id into two separate layer ids for image download requests [\#3378](https://github.com/nasa-gibs/worldview/pull/3378)
- Add z index to entire sidebar instead of individual elements [\#3377](https://github.com/nasa-gibs/worldview/pull/3377)
- Update GTM event names for 3.9.0 changes [\#3375](https://github.com/nasa-gibs/worldview/pull/3375)
- Handle undefined conceptids [\#3374](https://github.com/nasa-gibs/worldview/pull/3374)
- Disabled zoom button hover styles [\#3366](https://github.com/nasa-gibs/worldview/pull/3366)
- Move tour modal on short windows [\#3365](https://github.com/nasa-gibs/worldview/pull/3365)
- Restore event state on sidebar collapse/expand [\#3364](https://github.com/nasa-gibs/worldview/pull/3364)
- Fix end date used for matching coverage in layer panel, add back error css [\#3363](https://github.com/nasa-gibs/worldview/pull/3363)
- Use opacity to hide map scales on hover [\#3359](https://github.com/nasa-gibs/worldview/pull/3359)
- Change feature name to Location Search [\#3350](https://github.com/nasa-gibs/worldview/pull/3350)
- Stop animation on projection switch [\#3349](https://github.com/nasa-gibs/worldview/pull/3349)
- remove self value check against state value [\#3348](https://github.com/nasa-gibs/worldview/pull/3348)
- Fix animation widget interactions on touch devices [\#3346](https://github.com/nasa-gibs/worldview/pull/3346)
- Fix map zoom breakpoint hiding buttons, add responsive position change between breakpoints [\#3345](https://github.com/nasa-gibs/worldview/pull/3345)
- No Smart Handoff dates for non-temporal layers [\#3335](https://github.com/nasa-gibs/worldview/pull/3335)
- Revert animation daterange condition that limited closestdate from being used at end of range [\#3333](https://github.com/nasa-gibs/worldview/pull/3333)
- Event re-focus when switching projections [\#3330](https://github.com/nasa-gibs/worldview/pull/3330)
- fix label cutoff in firefox [\#3329](https://github.com/nasa-gibs/worldview/pull/3329)
- handle empty layers param [\#3328](https://github.com/nasa-gibs/worldview/pull/3328)
- Add map:contextmenu event trigger [\#3320](https://github.com/nasa-gibs/worldview/pull/3320)
- fix hyperlink color [\#3319](https://github.com/nasa-gibs/worldview/pull/3319)
- Prevent calling stop animation action when opening product picker if animation isn't playing [\#3312](https://github.com/nasa-gibs/worldview/pull/3312)
- Fix sidebar layer options button cursor [\#3310](https://github.com/nasa-gibs/worldview/pull/3310)
- Fix failing firefox e2e tests [\#3308](https://github.com/nasa-gibs/worldview/pull/3308)
- Fix mouseover feature check and sidebar layer row height for vector layers with features that don't have palette\(s\) [\#3306](https://github.com/nasa-gibs/worldview/pull/3306)
- Fix wrong variable for endDate check condition [\#3305](https://github.com/nasa-gibs/worldview/pull/3305)
- Fix console warning [\#3304](https://github.com/nasa-gibs/worldview/pull/3304)
- Update download docs [\#3296](https://github.com/nasa-gibs/worldview/pull/3296)
- Vis metadata [\#3294](https://github.com/nasa-gibs/worldview/pull/3294)
- JSON Schema layer validation [\#3292](https://github.com/nasa-gibs/worldview/pull/3292)
- Build categoryGroupOrder if missing during config [\#3283](https://github.com/nasa-gibs/worldview/pull/3283)
- fix image paths in smart handoffs modal [\#3280](https://github.com/nasa-gibs/worldview/pull/3280)
- Prevent zero currentStep from triggering Joyride wrapper [\#3279](https://github.com/nasa-gibs/worldview/pull/3279)
- Include animations in getRequestDates optimization, fix flakey timeline e2e test, fix data panel z-index [\#3277](https://github.com/nasa-gibs/worldview/pull/3277)
- Add Smart Handoffs GTM trigger events, fix moment date warning [\#3274](https://github.com/nasa-gibs/worldview/pull/3274)
- updated CYGNSS wind speed data download and links [\#3268](https://github.com/nasa-gibs/worldview/pull/3268)
- updated links to point to new asdc site [\#3265](https://github.com/nasa-gibs/worldview/pull/3265)
- Update unsupported browser detection to IE \<= 11 [\#3264](https://github.com/nasa-gibs/worldview/pull/3264)
- Remove jquery [\#3261](https://github.com/nasa-gibs/worldview/pull/3261)
- Make sure tooltips stay open when mousing over them [\#3257](https://github.com/nasa-gibs/worldview/pull/3257)
- Add data panel info dialog [\#3247](https://github.com/nasa-gibs/worldview/pull/3247)
- Add time parameter to browser URL if other parameter is present [\#3243](https://github.com/nasa-gibs/worldview/pull/3243)
- Add geosearch distraction free, projections, toolbar E2E tests [\#3241](https://github.com/nasa-gibs/worldview/pull/3241)
- Add dropdown height offset to scrollbar maxheight [\#3237](https://github.com/nasa-gibs/worldview/pull/3237)
- Layer grouping [\#3201](https://github.com/nasa-gibs/worldview/pull/3201)

## [v3.9.0-rc4](https://github.com/nasa-gibs/worldview/tree/v3.9.0-rc4) (2021-03-01)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.9.0-rc3...v3.9.0-rc4)

## Merged PRs:

- updated url [\#3390](https://github.com/nasa-gibs/worldview/pull/3390)
- Release 3.9.0 [\#3387](https://github.com/nasa-gibs/worldview/pull/3387)

## [v3.9.0-rc3](https://github.com/nasa-gibs/worldview/tree/v3.9.0-rc3) (2021-02-25)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.9.0-rc2...v3.9.0-rc3)

## Closed Issues:

- Investigate what Volcanoes location data are available [\#3353](https://github.com/nasa-gibs/worldview/issues/3353)

## Merged PRs:

- Add clearsky cygnss layers [\#3386](https://github.com/nasa-gibs/worldview/pull/3386)
- Add amsre layers [\#3385](https://github.com/nasa-gibs/worldview/pull/3385)
- Fix running data issue [\#3384](https://github.com/nasa-gibs/worldview/pull/3384)
- dont require escaping underscores mid-word [\#3381](https://github.com/nasa-gibs/worldview/pull/3381)

## [v3.9.0-rc2](https://github.com/nasa-gibs/worldview/tree/v3.9.0-rc2) (2021-02-16)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.9.0-rc1...v3.9.0-rc2)

## Merged PRs:

- Fix location/measure tooltip interactions on tablet [\#3356](https://github.com/nasa-gibs/worldview/pull/3356)
- hide layers without snapshot \#3343 [\#3352](https://github.com/nasa-gibs/worldview/pull/3352)
- Revert "Bump react-draggable from 4.1.0 to 4.4.3" [\#3351](https://github.com/nasa-gibs/worldview/pull/3351)
- Add WMS breakpoint to Reservoir & powerplant layers  [\#3344](https://github.com/nasa-gibs/worldview/pull/3344)
- Update data download availability text [\#3342](https://github.com/nasa-gibs/worldview/pull/3342)
- updates to AOD descriptions [\#3327](https://github.com/nasa-gibs/worldview/pull/3327)

## [v3.9.0-rc1](https://github.com/nasa-gibs/worldview/tree/v3.9.0-rc1) (2021-02-04)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.8.5...v3.9.0-rc1)

## Technical Updates / Bugfixes:

- Add different array of WMS res for 512px tiles \#3177 [\#3239](https://github.com/nasa-gibs/worldview/pull/3239)

## Merged PRs:

- Add hls latency [\#3298](https://github.com/nasa-gibs/worldview/pull/3298)
- Add maiac descriptions [\#3295](https://github.com/nasa-gibs/worldview/pull/3295)
- 3196 add viirs bt layers [\#3290](https://github.com/nasa-gibs/worldview/pull/3290)
- Add GTM to index html, use deployment environment variable for ID [\#3288](https://github.com/nasa-gibs/worldview/pull/3288)
- 3.8.5 -\> develop [\#3287](https://github.com/nasa-gibs/worldview/pull/3287)
- Revise geosearch config feature check [\#3281](https://github.com/nasa-gibs/worldview/pull/3281)
- Add dnb data download [\#3273](https://github.com/nasa-gibs/worldview/pull/3273)
- Remove legacy events service [\#3246](https://github.com/nasa-gibs/worldview/pull/3246)
- Add preview image screenshot generation script, modify dist to use brand url [\#3245](https://github.com/nasa-gibs/worldview/pull/3245)
- Add terser webpack plugin, remove uglify js [\#3235](https://github.com/nasa-gibs/worldview/pull/3235)
- Smart handoffs [\#3195](https://github.com/nasa-gibs/worldview/pull/3195)

## [v3.8.5](https://github.com/nasa-gibs/worldview/tree/v3.8.5) (2021-01-21)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.8.4...v3.8.5)

## Implemented Enhancements:

- Update KMZ layer title to be GIBS layer title not identifier [\#3259](https://github.com/nasa-gibs/worldview/issues/3259)
- Add legend to KM\[LZ\] output from image snapshot [\#3258](https://github.com/nasa-gibs/worldview/issues/3258)
- Add eslint react/no-unused-prop-types [\#3231](https://github.com/nasa-gibs/worldview/issues/3231)

## Technical Updates / Bugfixes:

- ruler/timeline cover rotation buttons in arctic and antarctic projections on Android tablet [\#2832](https://github.com/nasa-gibs/worldview/issues/2832)

## Story Changes:

- HLS Tour Story [\#3111](https://github.com/nasa-gibs/worldview/issues/3111)

## Closed Issues:

- Come up with a way to check that all conceptIDs return a dataset [\#3266](https://github.com/nasa-gibs/worldview/issues/3266)

## Merged PRs:

- Release v3.8.4 [\#3226](https://github.com/nasa-gibs/worldview/pull/3226)

## [v3.8.4](https://github.com/nasa-gibs/worldview/tree/v3.8.4) (2020-12-16)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.8.3...v3.8.4)

## Merged PRs:

- added notice to relevant MODIS/Terra layers [\#3224](https://github.com/nasa-gibs/worldview/pull/3224)
- Updates to DNB [\#3219](https://github.com/nasa-gibs/worldview/pull/3219)
- \[Snyk\] Security upgrade urllib3 from 1.24.3 to 1.25.9 [\#3137](https://github.com/nasa-gibs/worldview/pull/3137)

## [v3.8.3](https://github.com/nasa-gibs/worldview/tree/v3.8.3) (2020-12-03)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.8.2...v3.8.3)

## Implemented Enhancements:

- Add VIIRS SNPP Day/Night Band At Sensor Radiance [\#3197](https://github.com/nasa-gibs/worldview/issues/3197)
- Webpack build enhancements [\#1186](https://github.com/nasa-gibs/worldview/issues/1186)
- Epic - Improve Google Chrome Audit Score [\#1126](https://github.com/nasa-gibs/worldview/issues/1126)

## Technical Updates / Bugfixes:

- Trackpad zoom is too fast/sensitive [\#3109](https://github.com/nasa-gibs/worldview/issues/3109)
- Console warning on layer add [\#2921](https://github.com/nasa-gibs/worldview/issues/2921)

## Closed Issues:

- Clean up CSS dependencies [\#2064](https://github.com/nasa-gibs/worldview/issues/2064)
- Automate permalink testing [\#1552](https://github.com/nasa-gibs/worldview/issues/1552)
- Preload key requests [\#1128](https://github.com/nasa-gibs/worldview/issues/1128)
- GIBS Metadata Needs Gathering [\#1120](https://github.com/nasa-gibs/worldview/issues/1120)
- Create mobile-specific E2E tests [\#937](https://github.com/nasa-gibs/worldview/issues/937)
- Add debug tools for vector specific data [\#561](https://github.com/nasa-gibs/worldview/issues/561)
- Look into removing overqualified type selectors \(type.id / type.class chaining\) [\#446](https://github.com/nasa-gibs/worldview/issues/446)
- Remove use of !important within css declarations and add lint rule [\#445](https://github.com/nasa-gibs/worldview/issues/445)
- Prevent use of em units in css. Use px instead. [\#441](https://github.com/nasa-gibs/worldview/issues/441)
- Fix selectors of lower specificity from coming after overriding selectors of higher specificity in CSS [\#440](https://github.com/nasa-gibs/worldview/issues/440)
- Convert CSS ID / Element selectors into class selectors [\#438](https://github.com/nasa-gibs/worldview/issues/438)
- Remove wv.mobile.css separate stylesheet; convert rules to mobile first [\#426](https://github.com/nasa-gibs/worldview/issues/426)

## Merged PRs:

- Update version to v3.8.3 [\#3205](https://github.com/nasa-gibs/worldview/pull/3205)
- Create VIIRS\_SNPP\_DayNightBand\_At\_Sensor\_Radiance.jpg [\#3204](https://github.com/nasa-gibs/worldview/pull/3204)
- Add new dnb layer [\#3202](https://github.com/nasa-gibs/worldview/pull/3202)

## [v3.8.2](https://github.com/nasa-gibs/worldview/tree/v3.8.2) (2020-09-14)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.8.1...v3.8.2)

## Implemented Enhancements:

- Allow downloading measurements as Shapefiles [\#3041](https://github.com/nasa-gibs/worldview/issues/3041)
- Reset or remove Recent Layers on invalid/unknown layer id [\#3002](https://github.com/nasa-gibs/worldview/issues/3002)
- Epic - Vector base capabilities v1.1 [\#1766](https://github.com/nasa-gibs/worldview/issues/1766)

## Closed Issues:

- Epic - Product Picker [\#2069](https://github.com/nasa-gibs/worldview/issues/2069)
- Add vector filters to sidebar layer settings UI [\#1775](https://github.com/nasa-gibs/worldview/issues/1775)

## Merged PRs:

- V3.8.2 hotfix [\#3113](https://github.com/nasa-gibs/worldview/pull/3113)
- bump version to 3.8.1 [\#3103](https://github.com/nasa-gibs/worldview/pull/3103)

## [v3.8.1](https://github.com/nasa-gibs/worldview/tree/v3.8.1) (2020-09-10)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.8.0...v3.8.1)

## Implemented Enhancements:

- Investigate implementing React Fast Refresh [\#2980](https://github.com/nasa-gibs/worldview/issues/2980)
- Consolidate vector styles [\#2937](https://github.com/nasa-gibs/worldview/issues/2937)

## Technical Updates / Bugfixes:

- “unary operator expected” warning message during build [\#3091](https://github.com/nasa-gibs/worldview/issues/3091)
- Fix syntax warnings in build [\#3060](https://github.com/nasa-gibs/worldview/issues/3060)
- Using the collapse button in the layer sidebar causes sidebar to be highlighted [\#2975](https://github.com/nasa-gibs/worldview/issues/2975)
- npm version warning should not show if criteria is met [\#2945](https://github.com/nasa-gibs/worldview/issues/2945)

## Merged PRs:

- make default filesize of 512 for wms layer requests [\#3102](https://github.com/nasa-gibs/worldview/pull/3102)

## [v3.8.0](https://github.com/nasa-gibs/worldview/tree/v3.8.0) (2020-09-09)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.7.1...v3.8.0)

## Implemented Enhancements:

- Upgraded OCO-2 STD products to v10 [\#3082](https://github.com/nasa-gibs/worldview/issues/3082)
- Added VIIRS STD/NRT v11 Dark Target [\#3080](https://github.com/nasa-gibs/worldview/issues/3080)
- Measure tool improvements [\#2993](https://github.com/nasa-gibs/worldview/issues/2993)
- Improve geostationary imagery availability feedback [\#2893](https://github.com/nasa-gibs/worldview/issues/2893)
- Add ability to prevent clicking of certain feature [\#2729](https://github.com/nasa-gibs/worldview/issues/2729)
- Add end-to-end tests with localStorage disabled [\#2062](https://github.com/nasa-gibs/worldview/issues/2062)
- Migrate from OL5 -\> OL6 [\#1949](https://github.com/nasa-gibs/worldview/issues/1949)
- prevent showing unwanted vector metaData  [\#2963](https://github.com/nasa-gibs/worldview/pull/2963)

## Technical Updates / Bugfixes:

- Several Fires layers missing associated orbit tracks [\#3096](https://github.com/nasa-gibs/worldview/issues/3096)
- Hand pointer icon overflow styling in sidebar layer list item [\#3093](https://github.com/nasa-gibs/worldview/issues/3093)
- Future natural event dates can make timeline selected date stick [\#3081](https://github.com/nasa-gibs/worldview/issues/3081)
- ghost measurement labels [\#3072](https://github.com/nasa-gibs/worldview/issues/3072)
- Social links are not displaying correct urls on hover / twitter not opening correct url [\#3067](https://github.com/nasa-gibs/worldview/issues/3067)
- Facets source issue [\#3061](https://github.com/nasa-gibs/worldview/issues/3061)
- Step 2 of Australia tour story loads slowly [\#3059](https://github.com/nasa-gibs/worldview/issues/3059)
- Cannot select granule in Data Download [\#3054](https://github.com/nasa-gibs/worldview/issues/3054)
- SIT - Zoom in/out button not disabled when zoomed all the way in/out [\#3052](https://github.com/nasa-gibs/worldview/issues/3052)
- Unable to open attribute table for vectors on mobile [\#3046](https://github.com/nasa-gibs/worldview/issues/3046)
- Mobile zoom and drag gestures don't work on mobile/ipad \[map.zoom.9-10, map.pam.1-5. map.rotate.1-9\] [\#3045](https://github.com/nasa-gibs/worldview/issues/3045)
- Recent layers should not make assumptions about projections [\#3038](https://github.com/nasa-gibs/worldview/issues/3038)
- Unable to play animation in step 2 of Australia fire story [\#3037](https://github.com/nasa-gibs/worldview/issues/3037)
- Hovering over a fire at outer zoom levels no longer highlights the legend entry \[layer.legend.5\] [\#3033](https://github.com/nasa-gibs/worldview/issues/3033)
- Animation precache not consistent for geostationary layers [\#3029](https://github.com/nasa-gibs/worldview/issues/3029)
- Remove startDate from fires and update dates in Fire descriptions [\#3017](https://github.com/nasa-gibs/worldview/issues/3017)
- Arctic Terra, Aqua and Terra & Aqua fire vectors are not styled correctly [\#3013](https://github.com/nasa-gibs/worldview/issues/3013)
- Update Australia bushfire tour story [\#3010](https://github.com/nasa-gibs/worldview/issues/3010)
- App won't load when run with start script [\#3008](https://github.com/nasa-gibs/worldview/issues/3008)
- Historical geostationary imagery not accessible [\#3005](https://github.com/nasa-gibs/worldview/issues/3005)
- Measurement labels are removed in distraction free mode [\#2999](https://github.com/nasa-gibs/worldview/issues/2999)
- Clicking a measurement feature causes app to crash [\#2997](https://github.com/nasa-gibs/worldview/issues/2997)
- Measure distance tool: start point "wandering." [\#2991](https://github.com/nasa-gibs/worldview/issues/2991)
- Coverage facet does not account for compare mode [\#2973](https://github.com/nasa-gibs/worldview/issues/2973)
- Add current time to URLs that are shared [\#2942](https://github.com/nasa-gibs/worldview/issues/2942)
- Labels next to checkboxes should toggle the checkbox [\#2701](https://github.com/nasa-gibs/worldview/issues/2701)
- add pointer-events polyfill [\#3047](https://github.com/nasa-gibs/worldview/pull/3047)

## Story Changes:

- Cloud tour story [\#2987](https://github.com/nasa-gibs/worldview/pull/2987)

## External Dependency Updates:

- \[Security\] Bump elliptic from 6.5.2 to 6.5.3 [\#3004](https://github.com/nasa-gibs/worldview/pull/3004)
- Bump jest from 25.1.0 to 26.1.0 [\#2970](https://github.com/nasa-gibs/worldview/pull/2970)
- \[Security\] Bump websocket-extensions from 0.1.3 to 0.1.4 [\#2936](https://github.com/nasa-gibs/worldview/pull/2936)
- Bump node-ssh from 8.0.0 to 10.0.2 [\#2925](https://github.com/nasa-gibs/worldview/pull/2925)
- Bump eslint-plugin-node from 10.0.0 to 11.1.0 [\#2924](https://github.com/nasa-gibs/worldview/pull/2924)
- Bump html-loader from 0.5.5 to 1.1.0 [\#2920](https://github.com/nasa-gibs/worldview/pull/2920)
- Bump file-loader from 5.0.2 to 6.0.0 [\#2879](https://github.com/nasa-gibs/worldview/pull/2879)
- Bump html-webpack-plugin from 3.2.0 to 4.3.0 [\#2873](https://github.com/nasa-gibs/worldview/pull/2873)
- Bump sass-loader from 7.3.1 to 8.0.2 [\#2756](https://github.com/nasa-gibs/worldview/pull/2756)

## Closed Issues:

- Epic - Timeline Enhancements v1.1 [\#1776](https://github.com/nasa-gibs/worldview/issues/1776)
- Added OCO-3 layers [\#3018](https://github.com/nasa-gibs/worldview/issues/3018)
- Update Fire descriptions [\#3012](https://github.com/nasa-gibs/worldview/issues/3012)
- Allow downloading measurements as GeoJSON and/or shapefiles [\#3006](https://github.com/nasa-gibs/worldview/issues/3006)
- Add Suomi NPP/VIIRS All fires layer [\#2981](https://github.com/nasa-gibs/worldview/issues/2981)
- Add note about ENCC [\#2977](https://github.com/nasa-gibs/worldview/issues/2977)
- Consider displaying a "recently used layers" panel  [\#2719](https://github.com/nasa-gibs/worldview/issues/2719)
- Upgrade Facebook \(Share\) API to v3.2+ [\#1855](https://github.com/nasa-gibs/worldview/issues/1855)

## Merged PRs:

- Develop =\> Master [\#3100](https://github.com/nasa-gibs/worldview/pull/3100)
- Release 3.8.0 [\#3099](https://github.com/nasa-gibs/worldview/pull/3099)
- added orbit tracks [\#3097](https://github.com/nasa-gibs/worldview/pull/3097)
- Update Featured - Socioeconomic Data Vectors.json [\#3094](https://github.com/nasa-gibs/worldview/pull/3094)
- Add dark target layers [\#3085](https://github.com/nasa-gibs/worldview/pull/3085)
- Update fire story color [\#3078](https://github.com/nasa-gibs/worldview/pull/3078)
- Fix share [\#3077](https://github.com/nasa-gibs/worldview/pull/3077)
- remove vector animation dead code  [\#3065](https://github.com/nasa-gibs/worldview/pull/3065)
- Fix anim vector [\#3063](https://github.com/nasa-gibs/worldview/pull/3063)
- update FIRMS preview images [\#3055](https://github.com/nasa-gibs/worldview/pull/3055)
- Master -\> develop [\#3051](https://github.com/nasa-gibs/worldview/pull/3051)
- Master -\> develop [\#3043](https://github.com/nasa-gibs/worldview/pull/3043)
- Update fires [\#3015](https://github.com/nasa-gibs/worldview/pull/3015)
- Geostationary availability fix [\#3007](https://github.com/nasa-gibs/worldview/pull/3007)
- Update angstrom metadata [\#3001](https://github.com/nasa-gibs/worldview/pull/3001)
- Implement React-fast-refresh [\#2990](https://github.com/nasa-gibs/worldview/pull/2990)
- added VIIRS SNPP ALL fires [\#2982](https://github.com/nasa-gibs/worldview/pull/2982)
- Added notice to ENCC [\#2978](https://github.com/nasa-gibs/worldview/pull/2978)
- Only show node version log message on installation if user version doesn't meet the requirements [\#2976](https://github.com/nasa-gibs/worldview/pull/2976)
- Change layer-pointer-icon styling position to top [\#3095](https://github.com/nasa-gibs/worldview/pull/3095)
- Add brackets to prevent syntax build warning message [\#3092](https://github.com/nasa-gibs/worldview/pull/3092)
- Update syntax to fix warnings [\#3090](https://github.com/nasa-gibs/worldview/pull/3090)
- Featured fire vectors [\#3089](https://github.com/nasa-gibs/worldview/pull/3089)
- Fix config issues [\#3088](https://github.com/nasa-gibs/worldview/pull/3088)
- Fix social share e2e test date formatting [\#3086](https://github.com/nasa-gibs/worldview/pull/3086)
- Filter unknown layer ids from recent layers [\#3084](https://github.com/nasa-gibs/worldview/pull/3084)
- Prevent future dates from being selected in date state [\#3083](https://github.com/nasa-gibs/worldview/pull/3083)
- Measure ghost tooltip [\#3073](https://github.com/nasa-gibs/worldview/pull/3073)
- 3067 fix social links [\#3071](https://github.com/nasa-gibs/worldview/pull/3071)
- Fix sources facet inconsistencies [\#3070](https://github.com/nasa-gibs/worldview/pull/3070)
- fixed text and typos [\#3069](https://github.com/nasa-gibs/worldview/pull/3069)
- Update docs for config dir consistency, add docker command [\#3064](https://github.com/nasa-gibs/worldview/pull/3064)
- fix issue with selecting granules near dateline [\#3057](https://github.com/nasa-gibs/worldview/pull/3057)
- Fix map zoom buttons to prevent changes while animating, debounce main zoom change function, and constrain mouse wheel [\#3053](https://github.com/nasa-gibs/worldview/pull/3053)
- Derive projections for recent layers storage from config [\#3040](https://github.com/nasa-gibs/worldview/pull/3040)
- Check for loop reset on start date and set timeout on animation date queuing [\#3039](https://github.com/nasa-gibs/worldview/pull/3039)
- Migrate to OL6 [\#3036](https://github.com/nasa-gibs/worldview/pull/3036)
- Download measurements [\#3034](https://github.com/nasa-gibs/worldview/pull/3034)
- removed startDate and updated temporal coverage [\#3031](https://github.com/nasa-gibs/worldview/pull/3031)
- Add oco3 layers [\#3030](https://github.com/nasa-gibs/worldview/pull/3030)
- Removed step 3 from australia tour story [\#3016](https://github.com/nasa-gibs/worldview/pull/3016)
- remove styles && add images -- FIRMS VECTORS [\#3014](https://github.com/nasa-gibs/worldview/pull/3014)
- Add preview images for MODIS thermal anomalies layers [\#3011](https://github.com/nasa-gibs/worldview/pull/3011)
- Revise babel-loader to add react-refresh on dev server only [\#3009](https://github.com/nasa-gibs/worldview/pull/3009)
- Remove dead code, revise http to https , and modify social meta tags [\#3003](https://github.com/nasa-gibs/worldview/pull/3003)
- Measure tool improvements [\#3000](https://github.com/nasa-gibs/worldview/pull/3000)
- Prevent features without def from pixel click dialog processing [\#2998](https://github.com/nasa-gibs/worldview/pull/2998)
- Make checkbox labels clickable [\#2996](https://github.com/nasa-gibs/worldview/pull/2996)
- FIRMS Vector layers [\#2995](https://github.com/nasa-gibs/worldview/pull/2995)
- Measurements drifting fix [\#2994](https://github.com/nasa-gibs/worldview/pull/2994)
- Sidebar text selection fix [\#2988](https://github.com/nasa-gibs/worldview/pull/2988)
- Recently Used Layers [\#2985](https://github.com/nasa-gibs/worldview/pull/2985)
- updated dates in night tour [\#2983](https://github.com/nasa-gibs/worldview/pull/2983)
- Selected date / coverage facet issue fix [\#2974](https://github.com/nasa-gibs/worldview/pull/2974)
- Add time to shared permalink if on current day [\#2972](https://github.com/nasa-gibs/worldview/pull/2972)
- Layer undefined issue [\#2971](https://github.com/nasa-gibs/worldview/pull/2971)
- Remove closed issues from changelog [\#2967](https://github.com/nasa-gibs/worldview/pull/2967)
- E2E for disabled localStorage [\#2962](https://github.com/nasa-gibs/worldview/pull/2962)
- Consolidate vector styles [\#2955](https://github.com/nasa-gibs/worldview/pull/2955)
- Geostationary availability feedback [\#2946](https://github.com/nasa-gibs/worldview/pull/2946)

## [v3.7.1](https://github.com/nasa-gibs/worldview/tree/v3.7.1) (2020-08-18)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.7.0...v3.7.1)

## Implemented Enhancements:

- Pull layer start dates from GC for WMS layers [\#2690](https://github.com/nasa-gibs/worldview/issues/2690)

## Merged PRs:

- Update package and package-lock to v3.7.1 [\#3050](https://github.com/nasa-gibs/worldview/pull/3050)
- update legends to correspond to updated FIRMS WMS styles [\#3048](https://github.com/nasa-gibs/worldview/pull/3048)
- \[Snyk\] Security upgrade lodash from 4.17.15 to 4.17.16 [\#2986](https://github.com/nasa-gibs/worldview/pull/2986)

## [v3.7.0](https://github.com/nasa-gibs/worldview/tree/v3.7.0) (2020-06-23)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.7.0-rc.1...v3.7.0)

## Implemented Enhancements:

- Adding AMSRU2 Ocean and Rain NRT  [\#2958](https://github.com/nasa-gibs/worldview/issues/2958)
- Enable wrapadjacentdays for All OMPS SO2 Layers [\#2953](https://github.com/nasa-gibs/worldview/issues/2953)
- Update URL shortener API to v4 [\#2943](https://github.com/nasa-gibs/worldview/issues/2943)
- Added New MODIS Chlorophyll, SST, and PAR  [\#2935](https://github.com/nasa-gibs/worldview/issues/2935)
- PODAAC Feb 2020 Updates [\#2934](https://github.com/nasa-gibs/worldview/issues/2934)
- Create a "static" filter for visibility facet  [\#2933](https://github.com/nasa-gibs/worldview/issues/2933)
- Create option for vector layers to display as WMS layers at low resolutions [\#2884](https://github.com/nasa-gibs/worldview/issues/2884)
- Adding VIIRS NOAA20 CR and I5 layers [\#2877](https://github.com/nasa-gibs/worldview/issues/2877)
- Don't include preview images when feature is disabled [\#2876](https://github.com/nasa-gibs/worldview/issues/2876)
- Product Picker Improvements - Phase 2 [\#2778](https://github.com/nasa-gibs/worldview/issues/2778)
- Support classification toggling for raster colormaps with one classification legend entry [\#2727](https://github.com/nasa-gibs/worldview/issues/2727)
- Shorten date range when creating dateArray in datesinDateRanges [\#2433](https://github.com/nasa-gibs/worldview/issues/2433)
- Scrolling in About page should maintain the header/title [\#2127](https://github.com/nasa-gibs/worldview/issues/2127)

## Technical Updates / Bugfixes:

- Sort out "best" and "std" vector layer deployment [\#2909](https://github.com/nasa-gibs/worldview/issues/2909)
- When "view dates" panel is opened for a layer, it remains open when switching to another layer description [\#2956](https://github.com/nasa-gibs/worldview/issues/2956)
- Facet filter syles in FireFox [\#2940](https://github.com/nasa-gibs/worldview/issues/2940)
- WV 3.7.0 /SIT - Firefox on laptops not displaying info button options "Explore Worldview" and "Distraction Free"  [\#2939](https://github.com/nasa-gibs/worldview/issues/2939)
- Tours are not zooming to the correct location [\#2929](https://github.com/nasa-gibs/worldview/issues/2929)
- Buttons not working in animation modal on iPad [\#2928](https://github.com/nasa-gibs/worldview/issues/2928)
- Writing DEC in date selector causes app to go to distraction free mode [\#2886](https://github.com/nasa-gibs/worldview/issues/2886)
- Data panel doesn't update activelayers on projection change [\#2850](https://github.com/nasa-gibs/worldview/issues/2850)
- Vector point rendering for macOS chrome 80/81 is unreliable [\#2840](https://github.com/nasa-gibs/worldview/issues/2840)
- "This tour is no longer supported" alert is positioned in the wrong place [\#2839](https://github.com/nasa-gibs/worldview/issues/2839)
- Focus on layer search input on product picker open [\#1454](https://github.com/nasa-gibs/worldview/issues/1454)

## Closed Issues:

- Limit animation interval [\#807](https://github.com/nasa-gibs/worldview/issues/807)
- Add "export to kml" button [\#47](https://github.com/nasa-gibs/worldview/issues/47)
- Add text to geostationary layers to state they are only available for the last 30 days [\#2871](https://github.com/nasa-gibs/worldview/issues/2871)
- Optimize client for vector capabilities [\#1711](https://github.com/nasa-gibs/worldview/issues/1711)

## Merged PRs:

- v3.7.0 release master branch merge [\#2966](https://github.com/nasa-gibs/worldview/pull/2966)
- v3.7.0 release [\#2965](https://github.com/nasa-gibs/worldview/pull/2965)
- fixed typo for SSH anomalies; other typos [\#2959](https://github.com/nasa-gibs/worldview/pull/2959)
- 2934 add podaac layers [\#2950](https://github.com/nasa-gibs/worldview/pull/2950)
- Make sure styles in FireFox look right [\#2941](https://github.com/nasa-gibs/worldview/pull/2941)
- Use getElementsByClassName method [\#2938](https://github.com/nasa-gibs/worldview/pull/2938)
- Focus search input when product picker opened [\#2926](https://github.com/nasa-gibs/worldview/pull/2926)
- Enable redux devtools [\#2907](https://github.com/nasa-gibs/worldview/pull/2907)
- No previews dist build [\#2905](https://github.com/nasa-gibs/worldview/pull/2905)
- Update GRUMP\_Settlements.jpg [\#2964](https://github.com/nasa-gibs/worldview/pull/2964)
- change "at" to "on" [\#2961](https://github.com/nasa-gibs/worldview/pull/2961)
- added AMSRU2 layers [\#2960](https://github.com/nasa-gibs/worldview/pull/2960)
- View date ranges fix [\#2957](https://github.com/nasa-gibs/worldview/pull/2957)
- wrap so2 layers [\#2954](https://github.com/nasa-gibs/worldview/pull/2954)
- Coverage facets [\#2952](https://github.com/nasa-gibs/worldview/pull/2952)
- reassigned PAR to different categories [\#2951](https://github.com/nasa-gibs/worldview/pull/2951)
- Update to v4 bitly API [\#2949](https://github.com/nasa-gibs/worldview/pull/2949)
- Modify layer MODIS related test getting unavailable [\#2948](https://github.com/nasa-gibs/worldview/pull/2948)
- Hide vector pointer when layer is not visible [\#2947](https://github.com/nasa-gibs/worldview/pull/2947)
- 2935 add modis layers [\#2944](https://github.com/nasa-gibs/worldview/pull/2944)
- Package lock fix to 143c728 and run npm install [\#2932](https://github.com/nasa-gibs/worldview/pull/2932)
- Info typos [\#2927](https://github.com/nasa-gibs/worldview/pull/2927)
- Use require to import react-search-ui-views CSS file  [\#2923](https://github.com/nasa-gibs/worldview/pull/2923)
- Prevent distraction free mode from triggering from key shortcut when within INPUT [\#2897](https://github.com/nasa-gibs/worldview/pull/2897)
- Timeline axis SVG gridrange and dragger cleanups, remove unused hasMoved state [\#2896](https://github.com/nasa-gibs/worldview/pull/2896)
- Componentize data panel and refactor data line to SVG elements [\#2895](https://github.com/nasa-gibs/worldview/pull/2895)
- Optimize datesinDateRanges date coverage array building [\#2894](https://github.com/nasa-gibs/worldview/pull/2894)
- Fix condition in function used for linkcheck [\#2883](https://github.com/nasa-gibs/worldview/pull/2883)
- Add GA metrics for distraction free mode, data coverage panel, and permalink layers [\#2870](https://github.com/nasa-gibs/worldview/pull/2870)
- 2127 about header fix [\#2857](https://github.com/nasa-gibs/worldview/pull/2857)

## [v3.7.0-rc.1](https://github.com/nasa-gibs/worldview/tree/v3.7.0-rc.1) (2020-06-01)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.6.2...v3.7.0-rc.1)

## Implemented Enhancements:

- resolve webpack alaises config for eslint [\#2887](https://github.com/nasa-gibs/worldview/pull/2887)

## Technical Updates / Bugfixes:

- Extra map tiles loading as solid colors in Edge [\#2662](https://github.com/nasa-gibs/worldview/issues/2662)
- Stories misaligned when browser is zoomed out [\#2639](https://github.com/nasa-gibs/worldview/issues/2639)
- Date selector disappears when accessing Worldview via saved iPhone home screen icon/shortcut [\#2318](https://github.com/nasa-gibs/worldview/issues/2318)

## External Dependency Updates:

- Bump webpack-dev-server from 3.9.0 to 3.10.3 [\#2854](https://github.com/nasa-gibs/worldview/pull/2854)
- Bump react-beautiful-dnd from 12.2.0 to 13.0.0 [\#2853](https://github.com/nasa-gibs/worldview/pull/2853)
- Bump @fortawesome/free-solid-svg-icons from 5.12.1 to 5.13.0 [\#2852](https://github.com/nasa-gibs/worldview/pull/2852)
- Bump cross-env from 6.0.3 to 7.0.2 [\#2847](https://github.com/nasa-gibs/worldview/pull/2847)
- Bump webpack-bundle-analyzer from 3.6.1 to 3.7.0 [\#2846](https://github.com/nasa-gibs/worldview/pull/2846)
- Bump url-loader from 2.2.0 to 4.1.0 [\#2845](https://github.com/nasa-gibs/worldview/pull/2845)
- Bump webpack from 4.41.2 to 4.43.0 [\#2843](https://github.com/nasa-gibs/worldview/pull/2843)
- Bump uglify-js from 3.6.9 to 3.9.1 [\#2838](https://github.com/nasa-gibs/worldview/pull/2838)
- Bump css-loader from 3.2.0 to 3.5.2 [\#2831](https://github.com/nasa-gibs/worldview/pull/2831)
- Bump proj4 from 2.5.0 to 2.6.1 [\#2803](https://github.com/nasa-gibs/worldview/pull/2803)
- Bump babel-loader from 8.0.6 to 8.1.0 [\#2797](https://github.com/nasa-gibs/worldview/pull/2797)
- Bump react-loader from 2.4.5 to 2.4.7 [\#2762](https://github.com/nasa-gibs/worldview/pull/2762)
- Bump simplebar-react from 2.0.10 to 2.1.0 [\#2760](https://github.com/nasa-gibs/worldview/pull/2760)
- Bump @fortawesome/react-fontawesome from 0.1.8 to 0.1.9 [\#2758](https://github.com/nasa-gibs/worldview/pull/2758)
- Bump mini-css-extract-plugin from 0.8.0 to 0.9.0 [\#2757](https://github.com/nasa-gibs/worldview/pull/2757)

## Merged PRs:

- Settlements vector layer config [\#2915](https://github.com/nasa-gibs/worldview/pull/2915)
- Fix settlements colormap [\#2914](https://github.com/nasa-gibs/worldview/pull/2914)
- half Vector /  half WMS layers [\#2913](https://github.com/nasa-gibs/worldview/pull/2913)
- Metadata fixes [\#2912](https://github.com/nasa-gibs/worldview/pull/2912)
- Minor metadata updates [\#2908](https://github.com/nasa-gibs/worldview/pull/2908)
- Phase 2 product picker [\#2904](https://github.com/nasa-gibs/worldview/pull/2904)
- Added geostationary availability caveat [\#2901](https://github.com/nasa-gibs/worldview/pull/2901)
- Daynight layer props [\#2891](https://github.com/nasa-gibs/worldview/pull/2891)
- Add viirs noaa20 cr layers [\#2888](https://github.com/nasa-gibs/worldview/pull/2888)
- Fix typos [\#2866](https://github.com/nasa-gibs/worldview/pull/2866)
- Update browserslist to improve targeted browser support [\#2856](https://github.com/nasa-gibs/worldview/pull/2856)
- Filter activelayers used in data panel based on selected projection [\#2851](https://github.com/nasa-gibs/worldview/pull/2851)

## [v3.6.2](https://github.com/nasa-gibs/worldview/tree/v3.6.2) (2020-05-19)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.6.1...v3.6.2)

## Technical Updates / Bugfixes:

- Vector point bug on click [\#2898](https://github.com/nasa-gibs/worldview/issues/2898)

## Closed Issues:

- Update AMSR2 SWE notice [\#2885](https://github.com/nasa-gibs/worldview/issues/2885)

## Merged PRs:

- Update application version to v3.6.2 [\#2900](https://github.com/nasa-gibs/worldview/pull/2900)
- Fix vector onClick bug [\#2899](https://github.com/nasa-gibs/worldview/pull/2899)

## [v3.6.1](https://github.com/nasa-gibs/worldview/tree/v3.6.1) (2020-05-12)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.6.0...v3.6.1)

## Implemented Enhancements:

- Animation dragger is below data-bar chevron container [\#2829](https://github.com/nasa-gibs/worldview/issues/2829)
- Pre-push git hooks [\#2780](https://github.com/nasa-gibs/worldview/issues/2780)
- Replace Fontawesome with React-Fontawesome [\#2684](https://github.com/nasa-gibs/worldview/issues/2684)
- Limit the number of Travis jobs required to pass for a successful build [\#2656](https://github.com/nasa-gibs/worldview/issues/2656)
- Timeline should indicate yearly/season/monthly/weekly/composites layers more clearly [\#461](https://github.com/nasa-gibs/worldview/issues/461)
- Timeline availability bars should support time intervals [\#460](https://github.com/nasa-gibs/worldview/issues/460)

## Technical Updates / Bugfixes:

- ESC keypress doesn't close all modals [\#2828](https://github.com/nasa-gibs/worldview/issues/2828)
- A|B Comparion Test,  Add layer goes into Distraction Free mod [\#2826](https://github.com/nasa-gibs/worldview/issues/2826)
- Python permission denied errors on Windows [\#2787](https://github.com/nasa-gibs/worldview/issues/2787)
- Error "no file previewLayerOverrides.json" when previewSnapshots is set to false  [\#2783](https://github.com/nasa-gibs/worldview/issues/2783)

## Closed Issues:

- Add distraction free mode [\#2365](https://github.com/nasa-gibs/worldview/issues/2365)
- Timeline "data availability bar" updates [\#1772](https://github.com/nasa-gibs/worldview/issues/1772)

## Merged PRs:

- Update package.json and package-lock.json app version [\#2889](https://github.com/nasa-gibs/worldview/pull/2889)

## [v3.6.0](https://github.com/nasa-gibs/worldview/tree/v3.6.0) (2020-04-21)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.6.0-rc.2...v3.6.0)

## Implemented Enhancements:

- Adding AMSRU2 Rain products [\#2791](https://github.com/nasa-gibs/worldview/issues/2791)
- Fix additional linting warnings/errors [\#2781](https://github.com/nasa-gibs/worldview/issues/2781)
- Add VIIRS Cloud properties \(4\) [\#2770](https://github.com/nasa-gibs/worldview/issues/2770)
- Remove IMERG Rain and Snow Products [\#2751](https://github.com/nasa-gibs/worldview/issues/2751)
- Consider stricter code linting rules for a more consistent codebase [\#2728](https://github.com/nasa-gibs/worldview/issues/2728)
- Don't show measurement entry subtitle when expanded [\#2711](https://github.com/nasa-gibs/worldview/issues/2711)
- Can't drag luxor past what is visible on timeline \[date.pick.13\] [\#2579](https://github.com/nasa-gibs/worldview/issues/2579)
- Add invisible color to single custom palette  [\#2772](https://github.com/nasa-gibs/worldview/pull/2772)

## Technical Updates / Bugfixes:

- Layer slider operates in reverse on Android tablet [\#2836](https://github.com/nasa-gibs/worldview/issues/2836)
- S-14 Data Download: dd.size.4, Download Data does show total granule size  [\#2820](https://github.com/nasa-gibs/worldview/issues/2820)
- Animation doesn't stop when you add a layer \(S-06 date.animation.14\) [\#2818](https://github.com/nasa-gibs/worldview/issues/2818)
- S-04\[map\] map.init.13 Reset button indicates 0 [\#2817](https://github.com/nasa-gibs/worldview/issues/2817)
- Blue line inconsistent bottom alignment with luxor [\#2815](https://github.com/nasa-gibs/worldview/issues/2815)
- Blank screen for tour.link.12 [\#2813](https://github.com/nasa-gibs/worldview/issues/2813)
- Animation panel won't close when you click the x [\#2812](https://github.com/nasa-gibs/worldview/issues/2812)
- Day zoom level axis pan has wrong offset on update [\#2811](https://github.com/nasa-gibs/worldview/issues/2811)
- Remove "day" and "night" distinction from ICESat-2 and Metop-A orbit tracks [\#2808](https://github.com/nasa-gibs/worldview/issues/2808)
- Subdaily time is not retained when starting comparison mode with non subdaily layers [\#2768](https://github.com/nasa-gibs/worldview/issues/2768)
- Events not showing after exiting tour [\#2753](https://github.com/nasa-gibs/worldview/issues/2753)
- Clicking "remove filters" in Product picker doesn't toggle the "hide unavailable" filter [\#2740](https://github.com/nasa-gibs/worldview/issues/2740)
- Toolbar buttons retain grey background if clicked and that dialog is closed [\#2720](https://github.com/nasa-gibs/worldview/issues/2720)
- Product picker searches which only return 1 result don't load metadata \(details\) properly [\#2718](https://github.com/nasa-gibs/worldview/issues/2718)
- Zoom level not retained on tour permalink reload [\#2704](https://github.com/nasa-gibs/worldview/issues/2704)
- Outgoing permalink for rotated polar projections does not restore zoom level properly [\#2670](https://github.com/nasa-gibs/worldview/issues/2670)
- \[id.gif.8\] Custom color palette not restored after GIF download or image snapshot [\#2665](https://github.com/nasa-gibs/worldview/issues/2665)
- Measurements with long line segments can draw unexpectedly [\#2515](https://github.com/nasa-gibs/worldview/issues/2515)
- The previous UTC date should be displayed when before 3:00 UTC [\#2311](https://github.com/nasa-gibs/worldview/issues/2311)
- prevent glitchy vector rendering onZoom \#2840 [\#2841](https://github.com/nasa-gibs/worldview/pull/2841)
- Restore customs palette after closing gif or image-download  [\#2735](https://github.com/nasa-gibs/worldview/pull/2735)

## Closed Issues:

- Replace date-fns with moment [\#2336](https://github.com/nasa-gibs/worldview/issues/2336)

## Merged PRs:

- V3.6.0 [\#2842](https://github.com/nasa-gibs/worldview/pull/2842)
- Revert "\[Snyk\] Security upgrade jquery from 3.4.1 to 3.5.0" [\#2834](https://github.com/nasa-gibs/worldview/pull/2834)
- \[Snyk\] Security upgrade jquery from 3.4.1 to 3.5.0 [\#2833](https://github.com/nasa-gibs/worldview/pull/2833)
- Prevent keypress distraction free mode from invoking, close modals with ESC [\#2830](https://github.com/nasa-gibs/worldview/pull/2830)
- Reset button [\#2827](https://github.com/nasa-gibs/worldview/pull/2827)
- Various timeline data panel and dragger pan related UI fixes [\#2823](https://github.com/nasa-gibs/worldview/pull/2823)
- Fix missing animation widget close function [\#2814](https://github.com/nasa-gibs/worldview/pull/2814)
- updated icesat-2 orbit designations [\#2809](https://github.com/nasa-gibs/worldview/pull/2809)
- Add Timeline Pan on Dragger At Edge of Axis [\#2794](https://github.com/nasa-gibs/worldview/pull/2794)
- Add Timeline Data Availability Panel [\#2789](https://github.com/nasa-gibs/worldview/pull/2789)
- Run npm test on pre-push hook [\#2786](https://github.com/nasa-gibs/worldview/pull/2786)
- Allow disable preview snapshots [\#2785](https://github.com/nasa-gibs/worldview/pull/2785)
- Fixed spacing and typos in measurements [\#2782](https://github.com/nasa-gibs/worldview/pull/2782)
- Fix map scale remaining visible on hover when distraction free mode is activated [\#2777](https://github.com/nasa-gibs/worldview/pull/2777)
- Fix measure tooltip placement issue [\#2776](https://github.com/nasa-gibs/worldview/pull/2776)
- Fix toolbar focus styles issue [\#2775](https://github.com/nasa-gibs/worldview/pull/2775)
- Remove time zeroing from layer building date request [\#2773](https://github.com/nasa-gibs/worldview/pull/2773)
- Added 4 VIIRS Cloud Properties layers [\#2771](https://github.com/nasa-gibs/worldview/pull/2771)
- Product picker fixes [\#2752](https://github.com/nasa-gibs/worldview/pull/2752)
- Apply AirBnB style guide rules [\#2741](https://github.com/nasa-gibs/worldview/pull/2741)
- Replace FontAwesome with React-FontAwesome [\#2694](https://github.com/nasa-gibs/worldview/pull/2694)

## [v3.6.0-rc.2](https://github.com/nasa-gibs/worldview/tree/v3.6.0-rc.2) (2020-04-14)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.6.0-rc.1...v3.6.0-rc.2)

## Merged PRs:

- Update jquery per Snyk PR 2834 [\#2835](https://github.com/nasa-gibs/worldview/pull/2835)
- Stop animation playback when Product Picker is opened [\#2825](https://github.com/nasa-gibs/worldview/pull/2825)
- updated name to ICESat [\#2824](https://github.com/nasa-gibs/worldview/pull/2824)
- fix spelling of January [\#2821](https://github.com/nasa-gibs/worldview/pull/2821)
- Resolves issue with having invalid tour params. Utilize lodashGet to … [\#2819](https://github.com/nasa-gibs/worldview/pull/2819)

## [v3.6.0-rc.1](https://github.com/nasa-gibs/worldview/tree/v3.6.0-rc.1) (2020-04-07)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.5.1...v3.6.0-rc.1)

## Implemented Enhancements:

- Mobile datepicker should show forward/backward buttons [\#2642](https://github.com/nasa-gibs/worldview/issues/2642)
- Provide user guidance for layer selection [\#1394](https://github.com/nasa-gibs/worldview/issues/1394)
- Ability to filter by currently active products [\#962](https://github.com/nasa-gibs/worldview/issues/962)
- allow chrome e2e to fail  [\#2739](https://github.com/nasa-gibs/worldview/pull/2739)

## Technical Updates / Bugfixes:

- No Breadcrumb or back button when mobile category is selected \[layer.add.9\] [\#1843](https://github.com/nasa-gibs/worldview/issues/1843)

## External Dependency Updates:

- Bump postcss-cli from 6.1.3 to 7.1.0 [\#2747](https://github.com/nasa-gibs/worldview/pull/2747)
- Bump react-portal from 4.2.0 to 4.2.1 [\#2743](https://github.com/nasa-gibs/worldview/pull/2743)
- Bump yargs from 14.2.0 to 15.3.0 [\#2738](https://github.com/nasa-gibs/worldview/pull/2738)
- Bump node-ssh from 6.0.0 to 8.0.0 [\#2736](https://github.com/nasa-gibs/worldview/pull/2736)
- Bump eslint-plugin-jest from 23.6.0 to 23.8.2 [\#2733](https://github.com/nasa-gibs/worldview/pull/2733)
- Bump fetch-mock from 7.7.3 to 9.1.1 [\#2732](https://github.com/nasa-gibs/worldview/pull/2732)
- Bump @babel/core from 7.7.2 to 7.8.7 [\#2731](https://github.com/nasa-gibs/worldview/pull/2731)
- Bump rc-slider from 8.7.1 to 9.2.2 [\#2722](https://github.com/nasa-gibs/worldview/pull/2722)
- Bump stylelint from 11.1.1 to 13.2.0 [\#2658](https://github.com/nasa-gibs/worldview/pull/2658)
- Bump eslint-plugin-import from 2.18.2 to 2.20.1 [\#2621](https://github.com/nasa-gibs/worldview/pull/2621)
- Bump tar from 5.0.5 to 6.0.1 [\#2615](https://github.com/nasa-gibs/worldview/pull/2615)

## Merged PRs:

- Revert "Added 4 amsru2 layers" - Test [\#2810](https://github.com/nasa-gibs/worldview/pull/2810)
- Add info menu e2e [\#2806](https://github.com/nasa-gibs/worldview/pull/2806)
- Enable additional linting rules [\#2805](https://github.com/nasa-gibs/worldview/pull/2805)
- 2670 polar zoom restore [\#2804](https://github.com/nasa-gibs/worldview/pull/2804)
- Update Featured - Precipitation.json [\#2796](https://github.com/nasa-gibs/worldview/pull/2796)
- Added 4 amsru2 layers [\#2793](https://github.com/nasa-gibs/worldview/pull/2793)
- fixed incorrect description and typos [\#2790](https://github.com/nasa-gibs/worldview/pull/2790)
- Use python to invoke pip and add --user flag [\#2788](https://github.com/nasa-gibs/worldview/pull/2788)
- Fix polar tour events [\#2779](https://github.com/nasa-gibs/worldview/pull/2779)
- This resolves the view extent / zoom not being properly applied upon … [\#2766](https://github.com/nasa-gibs/worldview/pull/2766)
- Removed IMERG Rain and Snow Rates [\#2764](https://github.com/nasa-gibs/worldview/pull/2764)
- 2311 previous date not displaying fix [\#2726](https://github.com/nasa-gibs/worldview/pull/2726)
- Distraction free mode [\#2721](https://github.com/nasa-gibs/worldview/pull/2721)

## [v3.5.1](https://github.com/nasa-gibs/worldview/tree/v3.5.1) (2020-03-12)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.5.0...v3.5.1)

## Implemented Enhancements:

- Combine date-range code in product picker and layer-info modal [\#1749](https://github.com/nasa-gibs/worldview/issues/1749)
- Turn opaque classification values to transparent [\#232](https://github.com/nasa-gibs/worldview/issues/232)

## Technical Updates / Bugfixes:

- Added origin in image url can cause 404 when url path included index.html [\#2651](https://github.com/nasa-gibs/worldview/issues/2651)
- Chrome e2e Travis job failing [\#2646](https://github.com/nasa-gibs/worldview/issues/2646)

## Closed Issues:

- Update build scripts to fetch collection metadata for products [\#2507](https://github.com/nasa-gibs/worldview/issues/2507)

## Merged PRs:

- Added notice to AMSR2 SWE layers [\#2769](https://github.com/nasa-gibs/worldview/pull/2769)

## [v3.5.0](https://github.com/nasa-gibs/worldview/tree/v3.5.0) (2020-02-26)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.5.0-rc.4...v3.5.0)

## Implemented Enhancements:

- Update layer picker measurement styles to match search [\#2695](https://github.com/nasa-gibs/worldview/issues/2695)
- Add CloudSat Orbit Tracks [\#2668](https://github.com/nasa-gibs/worldview/issues/2668)
- Layer name change: white albedo name to replace current albedo name  [\#2666](https://github.com/nasa-gibs/worldview/issues/2666)
- Remove geostationary alert on load [\#2624](https://github.com/nasa-gibs/worldview/issues/2624)
- Added VIIRS NOAA20 Thermal Anomalies 375m Layers [\#2619](https://github.com/nasa-gibs/worldview/issues/2619)
- Product Picker Improvements - Phase 1 [\#2545](https://github.com/nasa-gibs/worldview/issues/2545)
- Add more whitespace around the GIF results [\#2288](https://github.com/nasa-gibs/worldview/issues/2288)
- Include timezone in the temporal coverage text [\#2286](https://github.com/nasa-gibs/worldview/issues/2286)
- Available imagery date/time is too long [\#2285](https://github.com/nasa-gibs/worldview/issues/2285)
- Remove the seconds from the timeline hovertip  [\#2284](https://github.com/nasa-gibs/worldview/issues/2284)
- Prevent frequent redrawing of color bars  [\#2123](https://github.com/nasa-gibs/worldview/issues/2123)
- End to end tests for mobile date selecting [\#2707](https://github.com/nasa-gibs/worldview/pull/2707)
- wrap a daily layer using the WrapX property [\#2641](https://github.com/nasa-gibs/worldview/pull/2641)
- Classification toggle [\#2576](https://github.com/nasa-gibs/worldview/pull/2576)

## Technical Updates / Bugfixes:

- Mobile date picker resetting when date changed from arrows [\#2714](https://github.com/nasa-gibs/worldview/issues/2714)
- Tool-tip date does not correspond with selected timeline date. [\#2706](https://github.com/nasa-gibs/worldview/issues/2706)
- Incorrect orbit track assignment [\#2702](https://github.com/nasa-gibs/worldview/issues/2702)
- Scroll bar overlaps layer list when you first add new layers [\#2692](https://github.com/nasa-gibs/worldview/issues/2692)
- IE11 Tour step dialog positioned off screen [\#2691](https://github.com/nasa-gibs/worldview/issues/2691)
- Timeline not centered on dragger/selected date [\#2677](https://github.com/nasa-gibs/worldview/issues/2677)
- cURL and wget bulk downloads not working \[SIT\] [\#2673](https://github.com/nasa-gibs/worldview/issues/2673)
- Layer color legend can disappear when zooming out [\#2664](https://github.com/nasa-gibs/worldview/issues/2664)
- Tour step footer arrow buttons overflow container [\#2661](https://github.com/nasa-gibs/worldview/issues/2661)
- Newly-added base layers can get inserted into middle of existing layers [\#2660](https://github.com/nasa-gibs/worldview/issues/2660)
- Back button does not show after searching for layers in arctic projection [\#2659](https://github.com/nasa-gibs/worldview/issues/2659)
- Layer building fails when tile matrices not included [\#2649](https://github.com/nasa-gibs/worldview/issues/2649)
- Animation widget speed slider is jumpy with retaining state [\#2608](https://github.com/nasa-gibs/worldview/issues/2608)
- Make image download temporary state revert actually be temporary [\#2571](https://github.com/nasa-gibs/worldview/issues/2571)
- Timeline pad scroll is too fast for reliable use [\#2554](https://github.com/nasa-gibs/worldview/issues/2554)
- Coordinates for snapshot bounding box show incorrectly if dateline is crossed [\#2551](https://github.com/nasa-gibs/worldview/issues/2551)
- Sea Surface Height imagery not loading under certain circumstances [\#2540](https://github.com/nasa-gibs/worldview/issues/2540)

## Layer Changes:

- G1SST set to inactive and notice added to description [\#2628](https://github.com/nasa-gibs/worldview/pull/2628)

## Closed Issues:

- Preview fetch script cleanup [\#2669](https://github.com/nasa-gibs/worldview/issues/2669)
- Mark G1SST as inactive and update layer description [\#2629](https://github.com/nasa-gibs/worldview/issues/2629)
- Link release notes in the About section [\#2626](https://github.com/nasa-gibs/worldview/issues/2626)
- Change the What's new link to GIBS Blog [\#2625](https://github.com/nasa-gibs/worldview/issues/2625)
- Unable to wrap a daily layer using the WrapX property [\#2573](https://github.com/nasa-gibs/worldview/issues/2573)
- Toggle-able classification color palettes feature [\#2306](https://github.com/nasa-gibs/worldview/issues/2306)
- Automate release notes [\#2075](https://github.com/nasa-gibs/worldview/issues/2075)

## Merged PRs:

- v3.5.0 [\#2712](https://github.com/nasa-gibs/worldview/pull/2712)
- Fix issue \#2642: Mobile datepicker should show forward/backward buttons [\#2643](https://github.com/nasa-gibs/worldview/pull/2643)
- Update mobile date picker state on arrow date change [\#2715](https://github.com/nasa-gibs/worldview/pull/2715)
- Add extra width to date tool tip [\#2698](https://github.com/nasa-gibs/worldview/pull/2698)
- 2692 scrollbar overlap [\#2697](https://github.com/nasa-gibs/worldview/pull/2697)
- center modal footer content [\#2696](https://github.com/nasa-gibs/worldview/pull/2696)
- added descriptions for the VIIRS NOAA20 fires [\#2687](https://github.com/nasa-gibs/worldview/pull/2687)
- Fix main app load function [\#2685](https://github.com/nasa-gibs/worldview/pull/2685)
- Remove unused await [\#2681](https://github.com/nasa-gibs/worldview/pull/2681)
- Add ipify metrics [\#2679](https://github.com/nasa-gibs/worldview/pull/2679)
- Fix add layer order based on overlay length and projection from action  [\#2672](https://github.com/nasa-gibs/worldview/pull/2672)
- Add cloudsat orbits [\#2671](https://github.com/nasa-gibs/worldview/pull/2671)
- Fix back button while searching in arctic proj [\#2663](https://github.com/nasa-gibs/worldview/pull/2663)
- Remove initial axisWidth input for timeline axis load [\#2657](https://github.com/nasa-gibs/worldview/pull/2657)
- Remove extra dragger container width [\#2655](https://github.com/nasa-gibs/worldview/pull/2655)
- Update release notes script [\#2654](https://github.com/nasa-gibs/worldview/pull/2654)
- Remove window location origin and path from config paths [\#2652](https://github.com/nasa-gibs/worldview/pull/2652)
- Handle undefined tile matrices [\#2650](https://github.com/nasa-gibs/worldview/pull/2650)
- Remove geostationary notice [\#2647](https://github.com/nasa-gibs/worldview/pull/2647)
- Product Picker Improvements - Phase 1  [\#2645](https://github.com/nasa-gibs/worldview/pull/2645)
- Remove seconds from timeline axis tooltip [\#2637](https://github.com/nasa-gibs/worldview/pull/2637)
- Update What's new URL and move release notes to About [\#2631](https://github.com/nasa-gibs/worldview/pull/2631)
- Fixed 404 links [\#2627](https://github.com/nasa-gibs/worldview/pull/2627)
- Remove NI metrics [\#2618](https://github.com/nasa-gibs/worldview/pull/2618)
- Fix formatting of the date/time that is displayed in the tooltip of a… [\#2616](https://github.com/nasa-gibs/worldview/pull/2616)
- Revise how slider handles speed state [\#2609](https://github.com/nasa-gibs/worldview/pull/2609)
- Fix data download commonly flaky e2e test [\#2596](https://github.com/nasa-gibs/worldview/pull/2596)
- Add release notes documentation and CHANGELOG.md [\#2577](https://github.com/nasa-gibs/worldview/pull/2577)
- Remove date-fns and refactor to native date methods for replacements [\#2572](https://github.com/nasa-gibs/worldview/pull/2572)
- Slow down scroll handlers, add scroll pan hoverTime calculation [\#2569](https://github.com/nasa-gibs/worldview/pull/2569)
- Prevent earlier dates from being added after later dates in layer dateArray building [\#2550](https://github.com/nasa-gibs/worldview/pull/2550)
- 2507 Fetch/process collection metadata [\#2535](https://github.com/nasa-gibs/worldview/pull/2535)

## [v3.5.0-rc.4](https://github.com/nasa-gibs/worldview/tree/v3.5.0-rc.4) (2020-02-26)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.5.0-rc.3...v3.5.0-rc.4)

## Merged PRs:

- 2695 measurement styles orange borders [\#2710](https://github.com/nasa-gibs/worldview/pull/2710)
- Fix tooltip date to use utc [\#2709](https://github.com/nasa-gibs/worldview/pull/2709)
- fixed incorrect orbit tracks [\#2703](https://github.com/nasa-gibs/worldview/pull/2703)
- E2E mobile layer picker [\#2693](https://github.com/nasa-gibs/worldview/pull/2693)
- change VIIRS NOAA20 start date [\#2688](https://github.com/nasa-gibs/worldview/pull/2688)
- preview image for viirs noaa layers [\#2686](https://github.com/nasa-gibs/worldview/pull/2686)

## [v3.5.0-rc.3](https://github.com/nasa-gibs/worldview/tree/v3.5.0-rc.3) (2020-02-20)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.5.0-rc.2...v3.5.0-rc.3)

## Merged PRs:

- preview fetch script fixes, integrate into build [\#2683](https://github.com/nasa-gibs/worldview/pull/2683)
- Renamed MODIS Albedo to White Sky Albedo [\#2682](https://github.com/nasa-gibs/worldview/pull/2682)
- 2664 layer legend disappear fix [\#2680](https://github.com/nasa-gibs/worldview/pull/2680)
- Fix cmr curl bulk download links [\#2676](https://github.com/nasa-gibs/worldview/pull/2676)
- Fix tour modal footer overflow issue [\#2675](https://github.com/nasa-gibs/worldview/pull/2675)

## [v3.5.0-rc.2](https://github.com/nasa-gibs/worldview/tree/v3.5.0-rc.2) (2020-02-13)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.5.0-rc.1...v3.5.0-rc.2)

## Merged PRs:

- Loaded lodash isEqual method to compare layer settings after prop cha… [\#2648](https://github.com/nasa-gibs/worldview/pull/2648)

## [v3.5.0-rc.1](https://github.com/nasa-gibs/worldview/tree/v3.5.0-rc.1) (2020-02-12)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.4.1...v3.5.0-rc.1)

## Implemented Enhancements:

- When animating to events zoom level should account for bounding boxes [\#496](https://github.com/nasa-gibs/worldview/issues/496)

## Technical Updates / Bugfixes:

- VIIRS Corrected Reflectance \(True Color\) layer imagery missing since Jan 1st 2020... [\#2614](https://github.com/nasa-gibs/worldview/issues/2614)
- Dateline hover dates are incorrect when in a tour story [\#2599](https://github.com/nasa-gibs/worldview/issues/2599)
- Data download not handling VIIRS layers [\#1939](https://github.com/nasa-gibs/worldview/issues/1939)

## External Dependency Updates:

- Bump moment-locales-webpack-plugin from 1.1.0 to 1.1.2 [\#2610](https://github.com/nasa-gibs/worldview/pull/2610)
- Bump bootstrap from 4.3.1 to 4.4.1 [\#2607](https://github.com/nasa-gibs/worldview/pull/2607)
- Bump react-image-crop from 8.4.0 to 8.5.0 [\#2606](https://github.com/nasa-gibs/worldview/pull/2606)
- Bump react-beautiful-dnd from 12.1.1 to 12.2.0 [\#2603](https://github.com/nasa-gibs/worldview/pull/2603)
- Bump bluebird from 3.7.1 to 3.7.2 [\#2594](https://github.com/nasa-gibs/worldview/pull/2594)
- Bump eslint from 6.6.0 to 6.8.0 [\#2592](https://github.com/nasa-gibs/worldview/pull/2592)
- Bump react-test-renderer from 16.11.0 to 16.12.0 [\#2591](https://github.com/nasa-gibs/worldview/pull/2591)
- Bump browserstack-local from 1.4.2 to 1.4.4 [\#2590](https://github.com/nasa-gibs/worldview/pull/2590)
- Bump jest from 24.9.0 to 25.1.0 [\#2589](https://github.com/nasa-gibs/worldview/pull/2589)
- Bump eslint-plugin-react from 7.16.0 to 7.18.0 [\#2588](https://github.com/nasa-gibs/worldview/pull/2588)
- Bump core-js from 3.3.6 to 3.6.4 [\#2563](https://github.com/nasa-gibs/worldview/pull/2563)
- Bump @babel/preset-env from 7.6.3 to 7.8.3 [\#2561](https://github.com/nasa-gibs/worldview/pull/2561)
- Bump eslint-plugin-jest from 23.0.2 to 23.6.0 [\#2558](https://github.com/nasa-gibs/worldview/pull/2558)
- Bump file-loader from 4.2.0 to 5.0.2 [\#2490](https://github.com/nasa-gibs/worldview/pull/2490)
- Bump immutability-helper from 2.9.1 to 3.0.1 [\#2409](https://github.com/nasa-gibs/worldview/pull/2409)
- Bump supercluster from 6.0.2 to 7.0.0 [\#2406](https://github.com/nasa-gibs/worldview/pull/2406)
- Bump react-copy-to-clipboard from 5.0.1 to 5.0.2 [\#2405](https://github.com/nasa-gibs/worldview/pull/2405)

## Closed Issues:

- 2071 [\#2622](https://github.com/nasa-gibs/worldview/issues/2622)
- \[technique question\] What is the structure of this red dot. [\#2578](https://github.com/nasa-gibs/worldview/issues/2578)
- Add VIIRS data download handlers to documentation [\#2386](https://github.com/nasa-gibs/worldview/issues/2386)
- IE11 and Chrome intermittent loader error [\#1633](https://github.com/nasa-gibs/worldview/issues/1633)
- Investigate NRT and science downloads for AMSRU2 Sea ice [\#1222](https://github.com/nasa-gibs/worldview/issues/1222)
- Create a test to ensure all layers in Worldview are in Product Picker [\#958](https://github.com/nasa-gibs/worldview/issues/958)
- Create mapbox-styles for vector layers [\#559](https://github.com/nasa-gibs/worldview/issues/559)

## Merged PRs:

- Add noaa20 fires [\#2640](https://github.com/nasa-gibs/worldview/pull/2640)
- 2286 timezone in temporal coverage [\#2635](https://github.com/nasa-gibs/worldview/pull/2635)
- wrap the snapshot label \#2551 [\#2633](https://github.com/nasa-gibs/worldview/pull/2633)
- Added padding modification to slightly tweak white space of GIF modal… [\#2630](https://github.com/nasa-gibs/worldview/pull/2630)
- Add windows docker shell script [\#2602](https://github.com/nasa-gibs/worldview/pull/2602)

## [v3.4.1](https://github.com/nasa-gibs/worldview/tree/v3.4.1) (2020-01-22)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.4.0...v3.4.1)

## Implemented Enhancements:

- Update Contributing documentation [\#2530](https://github.com/nasa-gibs/worldview/issues/2530)
- Add dateline wrap capability for vector products [\#2511](https://github.com/nasa-gibs/worldview/issues/2511)
- Remove seconds from the animated GIF [\#2287](https://github.com/nasa-gibs/worldview/issues/2287)

## Closed Issues:

- Wrap OMPS AI layers  [\#2597](https://github.com/nasa-gibs/worldview/issues/2597)

## Merged PRs:

- wrap AI and update fire tour [\#2601](https://github.com/nasa-gibs/worldview/pull/2601)
- Update date of dateline text on tour step change [\#2600](https://github.com/nasa-gibs/worldview/pull/2600)

## [v3.4.0](https://github.com/nasa-gibs/worldview/tree/v3.4.0) (2020-01-21)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.4.0-rc.2...v3.4.0)

## Implemented Enhancements:

- When changing tour step, give option to close a popup box or to keep it open [\#2539](https://github.com/nasa-gibs/worldview/issues/2539)
- Update build scripts to get colormaps concurrently [\#2498](https://github.com/nasa-gibs/worldview/issues/2498)
- Add Vectors to Featured Tab [\#2489](https://github.com/nasa-gibs/worldview/issues/2489)
- Replace forked redux-location-state with up to date npm version [\#2484](https://github.com/nasa-gibs/worldview/issues/2484)
- Allow invalid text entry into date fields [\#1662](https://github.com/nasa-gibs/worldview/issues/1662)
- Have coordinates show across the dateline [\#1610](https://github.com/nasa-gibs/worldview/issues/1610)
- Remove seconds from GIF labels [\#2534](https://github.com/nasa-gibs/worldview/pull/2534)
- Replace forked redux-location-state with up to date npm version [\#2505](https://github.com/nasa-gibs/worldview/pull/2505)
- Prevent custom interval selector from colliding with sidebar  [\#2500](https://github.com/nasa-gibs/worldview/pull/2500)

## Technical Updates / Bugfixes:

- Strange rendering of dam vector layer in outermost zooms [\#2581](https://github.com/nasa-gibs/worldview/issues/2581)
- Clicking out of unacceptable date does not revert to previously selected date \[date.input.6\] [\#2580](https://github.com/nasa-gibs/worldview/issues/2580)
- Clicking on "i" in attribute table pop up renders the text behind the box [\#2538](https://github.com/nasa-gibs/worldview/issues/2538)
- Scroll bar missing from layer info temporal range date list [\#2521](https://github.com/nasa-gibs/worldview/issues/2521)
- Travis OSX builds breaking during python install step [\#2514](https://github.com/nasa-gibs/worldview/issues/2514)
- Concurrency build changes breaks windows build [\#2508](https://github.com/nasa-gibs/worldview/issues/2508)
- Timeline date arrows are too restrictive for the next increment time unit [\#2493](https://github.com/nasa-gibs/worldview/issues/2493)
- Custom Interval Selector panel is under the Layer list [\#2483](https://github.com/nasa-gibs/worldview/issues/2483)
- Creating area measurements that cross poles sometimes incorrect [\#2464](https://github.com/nasa-gibs/worldview/issues/2464)
- Hovering over a very low value causes the pointer to go off the colorbar [\#2388](https://github.com/nasa-gibs/worldview/issues/2388)
- Typing a value into the date field required a TAB or Enter to save the value [\#2359](https://github.com/nasa-gibs/worldview/issues/2359)
- Fix commonly flaky E2E test\(s\) [\#2355](https://github.com/nasa-gibs/worldview/issues/2355)
- Zots cause colorbar to shift to the right [\#2321](https://github.com/nasa-gibs/worldview/issues/2321)
- Should not be able to select Worldfile for KMZ in image download [\#1854](https://github.com/nasa-gibs/worldview/issues/1854)
- GC files not updating during fetch with certain OS [\#1721](https://github.com/nasa-gibs/worldview/issues/1721)
- Change width of palette canvas when zot is active  [\#2516](https://github.com/nasa-gibs/worldview/pull/2516)
- Don't apply margin directly to palette canvas  [\#2504](https://github.com/nasa-gibs/worldview/pull/2504)

## Layer Changes:

- Update text for Suomi NPP [\#2574](https://github.com/nasa-gibs/worldview/issues/2574)
- Add day and night tags for orbit tracks [\#2567](https://github.com/nasa-gibs/worldview/issues/2567)
- Remove AIRS CO Total Column Day/Night [\#2565](https://github.com/nasa-gibs/worldview/issues/2565)
- Remove wrap for AIRS CO and Methane [\#2552](https://github.com/nasa-gibs/worldview/issues/2552)
- Add WELD layer descriptions [\#2491](https://github.com/nasa-gibs/worldview/issues/2491)

## Story Changes:

- Fire tour story [\#2547](https://github.com/nasa-gibs/worldview/issues/2547)

## Closed Issues:

- Add apostrophe to What's New [\#2583](https://github.com/nasa-gibs/worldview/issues/2583)
- Update about and license information [\#2568](https://github.com/nasa-gibs/worldview/issues/2568)
- Change api ECHO urls to use CMR [\#2077](https://github.com/nasa-gibs/worldview/issues/2077)

## Merged PRs:

- Update upload script to set permissions on images/config directories [\#2586](https://github.com/nasa-gibs/worldview/pull/2586)
- Oz tour updates [\#2585](https://github.com/nasa-gibs/worldview/pull/2585)
- Add apostrophe to "What's new" [\#2584](https://github.com/nasa-gibs/worldview/pull/2584)
- Replace removed layer in animation test [\#2570](https://github.com/nasa-gibs/worldview/pull/2570)
- v3.4.0 [\#2587](https://github.com/nasa-gibs/worldview/pull/2587)
- Fix strange rendering of dam layer in outermost zooms [\#2582](https://github.com/nasa-gibs/worldview/pull/2582)
- Suomi text updates [\#2575](https://github.com/nasa-gibs/worldview/pull/2575)
- Remove AIRS CO Total Column [\#2566](https://github.com/nasa-gibs/worldview/pull/2566)
- Update mockCMR docs, ECHO api links [\#2524](https://github.com/nasa-gibs/worldview/pull/2524)
- Allow date arrows to squash final left/right click if time difference is less than selected increment [\#2512](https://github.com/nasa-gibs/worldview/pull/2512)
- Loosen date selector input validation to allow temporary invalid values and mouse click changes [\#2510](https://github.com/nasa-gibs/worldview/pull/2510)
- Added WELD Layer descriptions, added Vectors to Featured [\#2492](https://github.com/nasa-gibs/worldview/pull/2492)

## [v3.4.0-rc.2](https://github.com/nasa-gibs/worldview/tree/v3.4.0-rc.2) (2020-01-14)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.4.0-rc.1...v3.4.0-rc.2)

## Merged PRs:

- Updated copyright year and add geostationary information [\#2560](https://github.com/nasa-gibs/worldview/pull/2560)
- Australia fire tour [\#2559](https://github.com/nasa-gibs/worldview/pull/2559)
- Add orbit daynight tags [\#2555](https://github.com/nasa-gibs/worldview/pull/2555)
- Removed wrap on AIRS L2 CO and Methane [\#2553](https://github.com/nasa-gibs/worldview/pull/2553)

## [v3.4.0-rc.1](https://github.com/nasa-gibs/worldview/tree/v3.4.0-rc.1) (2020-01-07)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.3.1...v3.4.0-rc.1)

## Implemented Enhancements:

- Refractoring  mapLocationToState [\#2529](https://github.com/nasa-gibs/worldview/issues/2529)
- Add snapshots wms matching support for vector layers [\#2360](https://github.com/nasa-gibs/worldview/issues/2360)
- Have coordinates show across dateline [\#2499](https://github.com/nasa-gibs/worldview/pull/2499)

## Technical Updates / Bugfixes:

- npm build error [\#2528](https://github.com/nasa-gibs/worldview/issues/2528)
- Can not drag image selection area corners freely [\#2446](https://github.com/nasa-gibs/worldview/issues/2446)
- Dragging animation interval interval can "stick" [\#2390](https://github.com/nasa-gibs/worldview/issues/2390)
- Map crashes when selecting Hurricane Dorian tour story from arctic projection [\#2356](https://github.com/nasa-gibs/worldview/issues/2356)
- Style sidebar event item to allow for longer titles and prevent wrapping below icon [\#2299](https://github.com/nasa-gibs/worldview/issues/2299)
- Projection button does not appear in IE 11 [\#2200](https://github.com/nasa-gibs/worldview/issues/2200)
- Unable to click and use the scroll bar in Layers list \(windows/edge\) [\#2170](https://github.com/nasa-gibs/worldview/issues/2170)
- When overzoomed, Last of the Wild legend is squished [\#1684](https://github.com/nasa-gibs/worldview/issues/1684)

## External Dependency Updates:

- Bump react-dom from 16.11.0 to 16.12.0 [\#2417](https://github.com/nasa-gibs/worldview/pull/2417)

## Closed Issues:

- \[Question\]What server use as middle ware [\#2536](https://github.com/nasa-gibs/worldview/issues/2536)

## Merged PRs:

- Add scroll bar to layer info temporal scroll [\#2546](https://github.com/nasa-gibs/worldview/pull/2546)
- Vector bug fixes [\#2541](https://github.com/nasa-gibs/worldview/pull/2541)
- Update contribute docs [\#2531](https://github.com/nasa-gibs/worldview/pull/2531)
- Wrap vector layers at dateline [\#2523](https://github.com/nasa-gibs/worldview/pull/2523)
- Make Travis happy [\#2522](https://github.com/nasa-gibs/worldview/pull/2522)
- Image Download: Disable Worldfile when KMZ file type is selected [\#2517](https://github.com/nasa-gibs/worldview/pull/2517)
- Anti-meridian crossing measurements fix [\#2513](https://github.com/nasa-gibs/worldview/pull/2513)
- Windows concurrency fix [\#2509](https://github.com/nasa-gibs/worldview/pull/2509)
- fix flaky e2e test [\#2503](https://github.com/nasa-gibs/worldview/pull/2503)
- Use concurrency in build for colormaps [\#2502](https://github.com/nasa-gibs/worldview/pull/2502)
- Add GC dir to clean script [\#2497](https://github.com/nasa-gibs/worldview/pull/2497)
- Create gitleaks secret check action [\#2476](https://github.com/nasa-gibs/worldview/pull/2476)

## [v3.3.1](https://github.com/nasa-gibs/worldview/tree/v3.3.1) (2019-12-04)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.3.0...v3.3.1)

## Merged PRs:

- Moved orbit track tags to correct location [\#2486](https://github.com/nasa-gibs/worldview/pull/2486)

## [v3.3.0](https://github.com/nasa-gibs/worldview/tree/v3.3.0) (2019-12-04)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.3.0-rc.3...v3.3.0)

## Implemented Enhancements:

- Add VIIRS Atmos ClearSky Night NRT [\#2454](https://github.com/nasa-gibs/worldview/issues/2454)
- Base default vector metadata modal width on device width for mobile [\#2449](https://github.com/nasa-gibs/worldview/issues/2449)
- Remove Alaska/CONUS and Tree Cover WELD Products [\#2430](https://github.com/nasa-gibs/worldview/issues/2430)
- New WELD geographic and polar layers [\#2411](https://github.com/nasa-gibs/worldview/issues/2411)
- Shorter orbit track layers in sidebar layer list [\#2400](https://github.com/nasa-gibs/worldview/issues/2400)
- Animation panel should be moveable [\#2206](https://github.com/nasa-gibs/worldview/issues/2206)
- Minimize the animation widget [\#2081](https://github.com/nasa-gibs/worldview/issues/2081)
- Run Browserstack E2E tests on Dependabot branches  [\#1966](https://github.com/nasa-gibs/worldview/issues/1966)
- Improve discoverability of orbit tracks [\#1405](https://github.com/nasa-gibs/worldview/issues/1405)

## Technical Updates / Bugfixes:

- Layer palette tooltips show when sidebar is collapsed [\#2480](https://github.com/nasa-gibs/worldview/issues/2480)
- Multi-tab vector dialog can break app [\#2477](https://github.com/nasa-gibs/worldview/issues/2477)
- Running data label is still visible when layer is not visible in layer list [\#2469](https://github.com/nasa-gibs/worldview/issues/2469)
- Imagery not showing when animating geostationary at an off-10 min mark [\#2466](https://github.com/nasa-gibs/worldview/issues/2466)
- Vector points selectable on both sides of comparison dragger even when enabled on only one side [\#2465](https://github.com/nasa-gibs/worldview/issues/2465)
- Animation play queue is slow to start and animation doesn't loop [\#2461](https://github.com/nasa-gibs/worldview/issues/2461)
- Allow map to zoom in further in Arctic projection [\#2460](https://github.com/nasa-gibs/worldview/issues/2460)
- Events icons persist when you change to layers and then the projection [\#2459](https://github.com/nasa-gibs/worldview/issues/2459)
- Animation no-longer preloads sub-daily images  [\#2447](https://github.com/nasa-gibs/worldview/issues/2447)
- Only show running data value for active side of compare mode \(vectors\) [\#2439](https://github.com/nasa-gibs/worldview/issues/2439)
- Running-data tooltip offset problem in compare mode [\#2438](https://github.com/nasa-gibs/worldview/issues/2438)
- No way to tell when hovering over a value for single classification palette [\#2437](https://github.com/nasa-gibs/worldview/issues/2437)
- Comparison mode vector point grow effect not activating for B side [\#2431](https://github.com/nasa-gibs/worldview/issues/2431)
- Drag and drop layers in sidebar does not work consistently [\#2429](https://github.com/nasa-gibs/worldview/issues/2429)
- Can't retain threshold of second palette [\#2421](https://github.com/nasa-gibs/worldview/issues/2421)
- Some MODIS Cloud layers are thresholded when you add them to Worldview [\#2407](https://github.com/nasa-gibs/worldview/issues/2407)
- Animation playback hanging / looping issue [\#2399](https://github.com/nasa-gibs/worldview/issues/2399)
- Product picker list position scrolls to top on item select [\#2358](https://github.com/nasa-gibs/worldview/issues/2358)
- Production build not able to start locally [\#2348](https://github.com/nasa-gibs/worldview/issues/2348)
- Switching to data tab after selecting a Fire event causes app to crash [\#2332](https://github.com/nasa-gibs/worldview/issues/2332)
- Fix time snapping based on layer intervals [\#2129](https://github.com/nasa-gibs/worldview/issues/2129)
- Thresholded Dual colormaps not stored in permalink [\#2122](https://github.com/nasa-gibs/worldview/issues/2122)
- Can't remove visible layers  \[layer.active.4\]\[IOS\] [\#1841](https://github.com/nasa-gibs/worldview/issues/1841)
- Permalink updates before anything happens [\#1314](https://github.com/nasa-gibs/worldview/issues/1314)
- Only try to show running data values for active compare mode [\#2440](https://github.com/nasa-gibs/worldview/pull/2440)
- Fix data-download endless loop on data tab click [\#2391](https://github.com/nasa-gibs/worldview/pull/2391)

## Closed Issues:

- Upgrade simplebar to current version [\#1956](https://github.com/nasa-gibs/worldview/issues/1956)
- Upgrade core-js to v3.x [\#1842](https://github.com/nasa-gibs/worldview/issues/1842)

## Merged PRs:

- v3.3.1 [\#2487](https://github.com/nasa-gibs/worldview/pull/2487)
- v3.3.0 [\#2485](https://github.com/nasa-gibs/worldview/pull/2485)
- Fix drag/drop layers [\#2436](https://github.com/nasa-gibs/worldview/pull/2436)
- Orbit tracks [\#2428](https://github.com/nasa-gibs/worldview/pull/2428)
- Default to geographic selected projection if not specified for location pop action [\#2424](https://github.com/nasa-gibs/worldview/pull/2424)
- 2399 anim playback hangs [\#2413](https://github.com/nasa-gibs/worldview/pull/2413)
- Fix animation dragger range selection to allow subdaily time units [\#2393](https://github.com/nasa-gibs/worldview/pull/2393)
- Fix product picker scrolling to top on row expand [\#2384](https://github.com/nasa-gibs/worldview/pull/2384)
- Remove unused dependencies [\#2334](https://github.com/nasa-gibs/worldview/pull/2334)
- 1956 upgrade simplebar [\#2333](https://github.com/nasa-gibs/worldview/pull/2333)

## [v3.3.0-rc.3](https://github.com/nasa-gibs/worldview/tree/v3.3.0-rc.3) (2019-12-04)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.3.0-rc.1...v3.3.0-rc.3)

## Technical Updates / Bugfixes:

- Dragging layers in the sidebar doesn't maintain correct drag position [\#2445](https://github.com/nasa-gibs/worldview/issues/2445)
- Fix vector dialog [\#2478](https://github.com/nasa-gibs/worldview/pull/2478)
- Don't update permalink before user interacts with page [\#2467](https://github.com/nasa-gibs/worldview/pull/2467)

## Merged PRs:

- Don't show tooltips when target is not visible in sidebar scroll container [\#2482](https://github.com/nasa-gibs/worldview/pull/2482)
- Don't render sidebar contents when sidebar is collapsed [\#2481](https://github.com/nasa-gibs/worldview/pull/2481)
- Apply vector selected style to swipe compare features  [\#2475](https://github.com/nasa-gibs/worldview/pull/2475)
- Only draw event markers and update track during deselectEvent if events tab is active [\#2474](https://github.com/nasa-gibs/worldview/pull/2474)
- removed WELD Tree cover [\#2473](https://github.com/nasa-gibs/worldview/pull/2473)
- Prevent vector click/hover on non-active vector features in compare mode [\#2471](https://github.com/nasa-gibs/worldview/pull/2471)
- Increase available zoom levels for arctic projection [\#2470](https://github.com/nasa-gibs/worldview/pull/2470)
- Conditionally use default date for animations rather then time snapping [\#2462](https://github.com/nasa-gibs/worldview/pull/2462)
- Changed OMPS AI product [\#2458](https://github.com/nasa-gibs/worldview/pull/2458)
- Remove weld v15 [\#2457](https://github.com/nasa-gibs/worldview/pull/2457)
- Fix e2e tests sit [\#2456](https://github.com/nasa-gibs/worldview/pull/2456)
- added VIIRS clear sky night [\#2455](https://github.com/nasa-gibs/worldview/pull/2455)
- Make vector dialog more responsive [\#2451](https://github.com/nasa-gibs/worldview/pull/2451)
- Preload sub-daily layers for animation [\#2450](https://github.com/nasa-gibs/worldview/pull/2450)
- Remove min height and width to allow looser image selection area, remove adjacent unused code [\#2448](https://github.com/nasa-gibs/worldview/pull/2448)
- Fix running data tooltip in compare mode [\#2443](https://github.com/nasa-gibs/worldview/pull/2443)

## [v3.3.0-rc.1](https://github.com/nasa-gibs/worldview/tree/v3.3.0-rc.1) (2019-11-21)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.3.0-rc.2...v3.3.0-rc.1)

## External Dependency Updates:

- Bump uglify-js from 3.6.5 to 3.6.9 [\#2410](https://github.com/nasa-gibs/worldview/pull/2410)
- Bump react-redux from 7.1.1 to 7.1.3 [\#2403](https://github.com/nasa-gibs/worldview/pull/2403)
- Bump glob from 7.1.5 to 7.1.6 [\#2402](https://github.com/nasa-gibs/worldview/pull/2402)
- Bump @babel/plugin-proposal-class-properties from 7.5.5 to 7.7.0 [\#2401](https://github.com/nasa-gibs/worldview/pull/2401)
- Bump web-streams-polyfill from 1.3.2 to 2.0.6 [\#2398](https://github.com/nasa-gibs/worldview/pull/2398)
- Bump simplebar-react from 2.0.4 to 2.0.8 [\#2397](https://github.com/nasa-gibs/worldview/pull/2397)
- Bump @babel/core from 7.6.4 to 7.7.2 [\#2394](https://github.com/nasa-gibs/worldview/pull/2394)
- Bump fetch-mock from 7.7.0 to 7.7.3 [\#2387](https://github.com/nasa-gibs/worldview/pull/2387)
- Bump showdown from 1.9.0 to 1.9.1 [\#2382](https://github.com/nasa-gibs/worldview/pull/2382)
- Bump @babel/preset-react from 7.6.3 to 7.7.0 [\#2380](https://github.com/nasa-gibs/worldview/pull/2380)
- Bump react-beautiful-dnd from 11.0.5 to 12.0.0 [\#2372](https://github.com/nasa-gibs/worldview/pull/2372)
- Bump file-saver from 1.3.8 to 2.0.2 [\#2370](https://github.com/nasa-gibs/worldview/pull/2370)
- Bump geckodriver from 1.19.0 to 1.19.1 [\#2369](https://github.com/nasa-gibs/worldview/pull/2369)
- Bump chromedriver from 77.0.0 to 78.0.1 [\#2368](https://github.com/nasa-gibs/worldview/pull/2368)
- Bump postcss-url from 7.3.2 to 8.0.0 [\#2367](https://github.com/nasa-gibs/worldview/pull/2367)
- Bump core-js from 3.3.4 to 3.3.6 [\#2366](https://github.com/nasa-gibs/worldview/pull/2366)
- Bump webpack-cli from 3.3.9 to 3.3.10 [\#2362](https://github.com/nasa-gibs/worldview/pull/2362)
- Bump mini-css-extract-plugin from 0.4.5 to 0.8.0 [\#2354](https://github.com/nasa-gibs/worldview/pull/2354)
- Bump node-sass from 4.12.0 to 4.13.0 [\#2353](https://github.com/nasa-gibs/worldview/pull/2353)
- Bump uglify-js from 3.6.4 to 3.6.5 [\#2352](https://github.com/nasa-gibs/worldview/pull/2352)
- Bump eslint-plugin-jest from 22.20.0 to 23.0.2 [\#2350](https://github.com/nasa-gibs/worldview/pull/2350)
- Bump react from 16.9.0 to 16.11.0 [\#2346](https://github.com/nasa-gibs/worldview/pull/2346)
- Bump proj4 from 2.3.3 to 2.5.0 [\#2345](https://github.com/nasa-gibs/worldview/pull/2345)
- Bump yargs from 11.1.1 to 14.2.0 [\#2344](https://github.com/nasa-gibs/worldview/pull/2344)
- Bump fetch-mock from 7.5.1 to 7.7.0 [\#2342](https://github.com/nasa-gibs/worldview/pull/2342)
- Bump eslint from 6.5.1 to 6.6.0 [\#2338](https://github.com/nasa-gibs/worldview/pull/2338)
- Bump react-draggable from 4.0.3 to 4.1.0 [\#2337](https://github.com/nasa-gibs/worldview/pull/2337)
- Bump react-redux from 6.0.1 to 7.1.1 [\#2329](https://github.com/nasa-gibs/worldview/pull/2329)
- Bump postcss-loader from 2.1.6 to 3.0.0 [\#2327](https://github.com/nasa-gibs/worldview/pull/2327)
- Bump stylelint from 10.1.0 to 11.1.1 [\#2326](https://github.com/nasa-gibs/worldview/pull/2326)
- Bump bluebird from 3.5.5 to 3.7.1 [\#2281](https://github.com/nasa-gibs/worldview/pull/2281)

## Merged PRs:

- Snap layer times to previous available dates to prevent unnecessary network requests [\#2432](https://github.com/nasa-gibs/worldview/pull/2432)
- added tour story [\#2427](https://github.com/nasa-gibs/worldview/pull/2427)
- added 4 WELD layers [\#2426](https://github.com/nasa-gibs/worldview/pull/2426)
- Fix threshold [\#2422](https://github.com/nasa-gibs/worldview/pull/2422)
- Sedac vector layer release [\#2420](https://github.com/nasa-gibs/worldview/pull/2420)
- Fix production build [\#2375](https://github.com/nasa-gibs/worldview/pull/2375)
- Supercluster update from 3.0.2 to 6.0.2 [\#2351](https://github.com/nasa-gibs/worldview/pull/2351)
- Upgrade Core JS [\#2349](https://github.com/nasa-gibs/worldview/pull/2349)
- Update chromedriver [\#2323](https://github.com/nasa-gibs/worldview/pull/2323)
- Make animation panel draggable, collapsable [\#2322](https://github.com/nasa-gibs/worldview/pull/2322)
- update CSS to prevent event title wrapping [\#2315](https://github.com/nasa-gibs/worldview/pull/2315)
- E2E in Travis [\#2308](https://github.com/nasa-gibs/worldview/pull/2308)

## [v3.3.0-rc.2](https://github.com/nasa-gibs/worldview/tree/v3.3.0-rc.2) (2019-11-18)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.2.3...v3.3.0-rc.2)

## [v3.2.3](https://github.com/nasa-gibs/worldview/tree/v3.2.3) (2019-11-18)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.2.2...v3.2.3)

## Implemented Enhancements:

- Removed Non CRI GRACE Products. [\#2415](https://github.com/nasa-gibs/worldview/issues/2415)

## External Dependency Updates:

- Add GRACE data downloads when there are CMR records [\#1164](https://github.com/nasa-gibs/worldview/issues/1164)

## Merged PRs:

- v3.2.3 [\#2423](https://github.com/nasa-gibs/worldview/pull/2423)
- Removed non CRI GRACE layers [\#2416](https://github.com/nasa-gibs/worldview/pull/2416)

## [v3.2.2](https://github.com/nasa-gibs/worldview/tree/v3.2.2) (2019-11-14)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.2.1...v3.2.2)

## Implemented Enhancements:

- Vector style enhancements for initial release [\#2144](https://github.com/nasa-gibs/worldview/issues/2144)

## Technical Updates / Bugfixes:

- Map sometimes stops loading data [\#2357](https://github.com/nasa-gibs/worldview/issues/2357)
- Animted GIF creation with hour interval hangs [\#2335](https://github.com/nasa-gibs/worldview/issues/2335)

## Closed Issues:

- test [\#2381](https://github.com/nasa-gibs/worldview/issues/2381)
- Adding MAIAC layers \(4\) [\#2373](https://github.com/nasa-gibs/worldview/issues/2373)
- Transition "L3" MODIS Surface Reflectance to "L2G" identifiers [\#2324](https://github.com/nasa-gibs/worldview/issues/2324)
- Adding VIIRS Atmos products \(3\) [\#2316](https://github.com/nasa-gibs/worldview/issues/2316)

## Merged PRs:

- v3.2.2 [\#2414](https://github.com/nasa-gibs/worldview/pull/2414)
- Add VIIRS and MAIAC layers [\#2412](https://github.com/nasa-gibs/worldview/pull/2412)

## [v3.2.1](https://github.com/nasa-gibs/worldview/tree/v3.2.1) (2019-10-31)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.2.0...v3.2.1)

## Technical Updates / Bugfixes:

- Relative Humidity layers no longer exist \[dd.multi.1\] [\#2249](https://github.com/nasa-gibs/worldview/issues/2249)
- KMZ files no longer load in Global Mapper [\#2104](https://github.com/nasa-gibs/worldview/issues/2104)

## Closed Issues:

- Add World Database on Protected Areas layer [\#603](https://github.com/nasa-gibs/worldview/issues/603)

## Merged PRs:

- v3.2.1 [\#2363](https://github.com/nasa-gibs/worldview/pull/2363)
- Fix imagery not loading after build date [\#2361](https://github.com/nasa-gibs/worldview/pull/2361)

## [v3.2.0](https://github.com/nasa-gibs/worldview/tree/v3.2.0) (2019-10-21)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.2.0-rc.5...v3.2.0)

## Implemented Enhancements:

- Update GOES and Himawari "Red Visible" layer identifiers [\#2280](https://github.com/nasa-gibs/worldview/issues/2280)
- Investigate snapping hours/minutes to recent past when adding geostationary layer [\#2273](https://github.com/nasa-gibs/worldview/issues/2273)
- Update docs screenshot [\#2238](https://github.com/nasa-gibs/worldview/issues/2238)
- Be able to see and interact with multiple notification alerts at once [\#2209](https://github.com/nasa-gibs/worldview/issues/2209)
- Toggle OCO-2 layers as active [\#2150](https://github.com/nasa-gibs/worldview/issues/2150)
- Add SPoRT Imagery [\#2147](https://github.com/nasa-gibs/worldview/issues/2147)
- Add alert notification for geostationary imagery [\#2126](https://github.com/nasa-gibs/worldview/issues/2126)
- Add a new tab for featured layers [\#2125](https://github.com/nasa-gibs/worldview/issues/2125)
- Dust Storm Tour story [\#2111](https://github.com/nasa-gibs/worldview/issues/2111)
- Update timeline scale as time progresses while browser is open. [\#2106](https://github.com/nasa-gibs/worldview/issues/2106)
- Allow future date time snapping for subdaily layers [\#2041](https://github.com/nasa-gibs/worldview/issues/2041)
- Improve default animation range for sub-daily layers [\#1735](https://github.com/nasa-gibs/worldview/issues/1735)
- Add version info to Antarctic coastlines [\#1683](https://github.com/nasa-gibs/worldview/issues/1683)
- Utilize TileMatrixLimits for GeoStationary products [\#1680](https://github.com/nasa-gibs/worldview/issues/1680)
- Measure Tool [\#1193](https://github.com/nasa-gibs/worldview/issues/1193)
- Update layer legends to use tick marks from colormaps [\#67](https://github.com/nasa-gibs/worldview/issues/67)
- Fix broken e2e tests [\#2137](https://github.com/nasa-gibs/worldview/pull/2137)
- Fix Browserstack Integration [\#2134](https://github.com/nasa-gibs/worldview/pull/2134)
- Make animation start range dynamic [\#2110](https://github.com/nasa-gibs/worldview/pull/2110)
- Add Colormap ticks 67 [\#2100](https://github.com/nasa-gibs/worldview/pull/2100)
- Allow tour startup to show more than 9 stories [\#2080](https://github.com/nasa-gibs/worldview/pull/2080)

## Technical Updates / Bugfixes:

- Exiting comparison mode after moving B dragger doesn't load correct date on timeline [\#2303](https://github.com/nasa-gibs/worldview/issues/2303)
- When timeline is collapsed, custom interval selector box does not appear [\#2283](https://github.com/nasa-gibs/worldview/issues/2283)
- Fix/disable palette adjustments for Clean Infrared layers [\#2274](https://github.com/nasa-gibs/worldview/issues/2274)
- Fix e2e tests [\#2268](https://github.com/nasa-gibs/worldview/issues/2268)
- IE11 / Win8.1 and below - Alert text is not vertically centered [\#2259](https://github.com/nasa-gibs/worldview/issues/2259)
- IE11 tour title cut off [\#2256](https://github.com/nasa-gibs/worldview/issues/2256)
- Incorrect date for url date earlier than start date on mobile \[perm.in.date.1\] [\#2247](https://github.com/nasa-gibs/worldview/issues/2247)
- Measure modal not near button on mobile [\#2246](https://github.com/nasa-gibs/worldview/issues/2246)
- 'no results' text is cut off in layer picker \[layer.add.6\] [\#2244](https://github.com/nasa-gibs/worldview/issues/2244)
- \[events.mobile.init.3\] Can't scroll events list on iOS [\#2243](https://github.com/nasa-gibs/worldview/issues/2243)
- Strange display of tick marks for cloud top pressure layer \[layer.active.15\] [\#2242](https://github.com/nasa-gibs/worldview/issues/2242)
- \[settings.nav.7\] Layer Settings window does not close when you change to the Events tab [\#2240](https://github.com/nasa-gibs/worldview/issues/2240)
- Can not adjust the GIF selection boundary box \(date.animation.14\) [\#2237](https://github.com/nasa-gibs/worldview/issues/2237)
- Keyboard does not stay open on mobile Android when searching for layers [\#2234](https://github.com/nasa-gibs/worldview/issues/2234)
- IE11 - Tour dialog overlaps map scale [\#2231](https://github.com/nasa-gibs/worldview/issues/2231)
- Can no longer click next tour frame when animation is preloading \(tour.story.3\) [\#2229](https://github.com/nasa-gibs/worldview/issues/2229)
- IE11 Geostationary notice modal text overlaps image [\#2227](https://github.com/nasa-gibs/worldview/issues/2227)
- Permalinks to Tour story steps don't always restart tour at step 1 [\#2226](https://github.com/nasa-gibs/worldview/issues/2226)
- Running data style bug \(firefox\) [\#2224](https://github.com/nasa-gibs/worldview/issues/2224)
- Measure tool line repeats outside the map [\#2221](https://github.com/nasa-gibs/worldview/issues/2221)
- Can't open animation widget if custom interval is selected without set time unit [\#2220](https://github.com/nasa-gibs/worldview/issues/2220)
- IE11 measure tool modal positioned in upper right [\#2218](https://github.com/nasa-gibs/worldview/issues/2218)
- Opacity slider handle slightly off and jumpy \[setting.opacity.1\] [\#2217](https://github.com/nasa-gibs/worldview/issues/2217)
- Unnecessary legend tick marks for certain layer\(s\) [\#2216](https://github.com/nasa-gibs/worldview/issues/2216)
- Date change arrow causing double fire in IE11 [\#2215](https://github.com/nasa-gibs/worldview/issues/2215)
- Only show "too many frames" tooltip on GIF button on hover [\#2210](https://github.com/nasa-gibs/worldview/issues/2210)
- Tour modal will not scroll [\#2196](https://github.com/nasa-gibs/worldview/issues/2196)
- NaN is an invalid value for the left css style property error [\#2193](https://github.com/nasa-gibs/worldview/issues/2193)
- Animation increment not saved in permalink [\#2184](https://github.com/nasa-gibs/worldview/issues/2184)
- Render vector conditional styling in settings dialog [\#2180](https://github.com/nasa-gibs/worldview/issues/2180)
- Timeline ticks break when creating animation  [\#2165](https://github.com/nasa-gibs/worldview/issues/2165)
- Can't select Worldfile for image download [\#2155](https://github.com/nasa-gibs/worldview/issues/2155)
- Cached layers of blank tiles for subdaily layers not updated when imagery comes in [\#2149](https://github.com/nasa-gibs/worldview/issues/2149)
- Auto-config via GC document should match layers by source [\#2132](https://github.com/nasa-gibs/worldview/issues/2132)
- Can't tab through time selector to subdaily hour and minutes [\#2131](https://github.com/nasa-gibs/worldview/issues/2131)
- Animation loops gets stuck intermittently and continues to queue dates when paused/closed [\#2115](https://github.com/nasa-gibs/worldview/issues/2115)
- Frames count for animated gif disabling isn't always accurate [\#2108](https://github.com/nasa-gibs/worldview/issues/2108)
- Tour modal scroll area is cut off [\#2096](https://github.com/nasa-gibs/worldview/issues/2096)
- Python3 updates breaking CI [\#2087](https://github.com/nasa-gibs/worldview/issues/2087)
- Remove get-pip.py from source [\#2085](https://github.com/nasa-gibs/worldview/issues/2085)
- Make e2e tests run through browserstack [\#2030](https://github.com/nasa-gibs/worldview/issues/2030)
- Broken e2e tests [\#1964](https://github.com/nasa-gibs/worldview/issues/1964)
- Comparison mode opacity values are not saved in url [\#1891](https://github.com/nasa-gibs/worldview/issues/1891)
- Able to download image with a layer that has no data available [\#1661](https://github.com/nasa-gibs/worldview/issues/1661)
- Issue with adding Ice Velocity Greenland and Antarctica to categories [\#1608](https://github.com/nasa-gibs/worldview/issues/1608)
- Unable to take a snapshot of WDPA layer [\#1605](https://github.com/nasa-gibs/worldview/issues/1605)
- Multiple layers show "error loading metadata" in search results [\#1444](https://github.com/nasa-gibs/worldview/issues/1444)
- Fix tour scroll  [\#2198](https://github.com/nasa-gibs/worldview/pull/2198)
- Change subdaily props name to allow TAB action in date selector [\#2153](https://github.com/nasa-gibs/worldview/pull/2153)
- Update npm config used for CI/CD [\#2121](https://github.com/nasa-gibs/worldview/pull/2121)
- Fix CI build errors related to python3 [\#2088](https://github.com/nasa-gibs/worldview/pull/2088)
- Retain compare opacity value in permalink [\#2086](https://github.com/nasa-gibs/worldview/pull/2086)

## External Dependency Updates:

- Bump cross-env from 6.0.0 to 6.0.2 [\#2183](https://github.com/nasa-gibs/worldview/pull/2183)
- Bump redux from 4.0.1 to 4.0.4 [\#2175](https://github.com/nasa-gibs/worldview/pull/2175)
- Bump fetch-mock from 7.3.9 to 7.4.0 [\#2174](https://github.com/nasa-gibs/worldview/pull/2174)
- Bump eslint from 6.1.0 to 6.5.1 [\#2173](https://github.com/nasa-gibs/worldview/pull/2173)
- Bump tar from 4.4.10 to 5.0.2 [\#2172](https://github.com/nasa-gibs/worldview/pull/2172)
- Bump @babel/plugin-proposal-class-properties from 7.4.4 to 7.5.5 [\#2169](https://github.com/nasa-gibs/worldview/pull/2169)
- Bump webpack-dev-server from 3.7.2 to 3.8.1 [\#2160](https://github.com/nasa-gibs/worldview/pull/2160)
- Bump @fortawesome/fontawesome-free from 5.10.1 to 5.11.2 [\#2152](https://github.com/nasa-gibs/worldview/pull/2152)
- Bump postcss-preset-env from 6.6.0 to 6.7.0 [\#2140](https://github.com/nasa-gibs/worldview/pull/2140)
- Bump browserstack-local from 1.4.0 to 1.4.2 [\#2139](https://github.com/nasa-gibs/worldview/pull/2139)
- Bump write-file-webpack-plugin from 4.5.0 to 4.5.1 [\#2138](https://github.com/nasa-gibs/worldview/pull/2138)
- Bump cross-env from 5.2.0 to 6.0.0 [\#2135](https://github.com/nasa-gibs/worldview/pull/2135)
- Bump jest from 24.8.0 to 24.9.0 [\#2120](https://github.com/nasa-gibs/worldview/pull/2120)
- Bump react-draggable from 3.3.0 to 4.0.3 [\#2114](https://github.com/nasa-gibs/worldview/pull/2114)
- Bump rc-slider from 8.6.3 to 8.7.1 [\#2094](https://github.com/nasa-gibs/worldview/pull/2094)
- Bump eslint-plugin-node from 9.1.0 to 10.0.0 [\#2093](https://github.com/nasa-gibs/worldview/pull/2093)
- Bump sass-loader from 7.2.0 to 7.3.1 [\#2084](https://github.com/nasa-gibs/worldview/pull/2084)
- Bump eslint-config-standard from 13.0.1 to 14.0.1 [\#2078](https://github.com/nasa-gibs/worldview/pull/2078)

## Closed Issues:

- Dependabot needs permission to see redux-location-state [\#2301](https://github.com/nasa-gibs/worldview/issues/2301)
- Change text back to GOES-East and GOES-West [\#2265](https://github.com/nasa-gibs/worldview/issues/2265)
- Update resolution text for AIRS layers [\#2232](https://github.com/nasa-gibs/worldview/issues/2232)
- Add link to Earthdata Geostationary article to tour [\#2211](https://github.com/nasa-gibs/worldview/issues/2211)
- Update GitHub contributing document [\#2203](https://github.com/nasa-gibs/worldview/issues/2203)
- Contact SPoRT when release is in UAT [\#2197](https://github.com/nasa-gibs/worldview/issues/2197)
- Investigate if node-canvas is still needed and remove if it is not needed [\#2181](https://github.com/nasa-gibs/worldview/issues/2181)
- Looped animations over 10 steps do not use cached layer tiles [\#2166](https://github.com/nasa-gibs/worldview/issues/2166)
- Geostationary Tour Story [\#2128](https://github.com/nasa-gibs/worldview/issues/2128)
- Ensure that requested time is correct for image download in WV and will work for subdaily imagery [\#2103](https://github.com/nasa-gibs/worldview/issues/2103)
- Add MODIS L3 Cryosphere descriptions [\#2082](https://github.com/nasa-gibs/worldview/issues/2082)
- Provide a place to access older tour stories [\#1991](https://github.com/nasa-gibs/worldview/issues/1991)
- Investigate and update anti-meridian wrapping documentation [\#1742](https://github.com/nasa-gibs/worldview/issues/1742)
- Add AIRS L2 NRT \(26 layers\) [\#1741](https://github.com/nasa-gibs/worldview/issues/1741)
- Creating animation that includes a layer with no coverage throws error and gets stuck loading [\#1707](https://github.com/nasa-gibs/worldview/issues/1707)
- Update documentation [\#1689](https://github.com/nasa-gibs/worldview/issues/1689)
- Update build to use Python3 [\#1682](https://github.com/nasa-gibs/worldview/issues/1682)
- WDPA layer won't load due to mixed content [\#1603](https://github.com/nasa-gibs/worldview/issues/1603)

## Merged PRs:

- v3.2.0 [\#2313](https://github.com/nasa-gibs/worldview/pull/2313)
- Time snapping backwards when geostationary layers added [\#2312](https://github.com/nasa-gibs/worldview/pull/2312)
- Allow multiple alerts to show at once [\#2310](https://github.com/nasa-gibs/worldview/pull/2310)
- Set compare b dragger init flag to true on toggle [\#2307](https://github.com/nasa-gibs/worldview/pull/2307)
- remove dust storm story [\#2304](https://github.com/nasa-gibs/worldview/pull/2304)
- Updated wrap flag to work with snapshots across the dateline - rebase… [\#2296](https://github.com/nasa-gibs/worldview/pull/2296)
- Revise date change arrow intervals using higher scope and conditional flags [\#2267](https://github.com/nasa-gibs/worldview/pull/2267)
- remove screenHeight update on browsers less than medium [\#2261](https://github.com/nasa-gibs/worldview/pull/2261)
- Add initial height for tour modal content [\#2255](https://github.com/nasa-gibs/worldview/pull/2255)
- Add flex styling and minor changes to alert notification for consistent mobile/desktop style [\#2245](https://github.com/nasa-gibs/worldview/pull/2245)
- Update contributing & pull request templates [\#2233](https://github.com/nasa-gibs/worldview/pull/2233)
- make sure image behaves responsively even in IE11 [\#2230](https://github.com/nasa-gibs/worldview/pull/2230)
- Don't change interval until a selection has actually been made in the… [\#2225](https://github.com/nasa-gibs/worldview/pull/2225)
- Fix measurements wrapping on map [\#2223](https://github.com/nasa-gibs/worldview/pull/2223)
- fix measure tool modal styles so it aligns properly in ie11 [\#2222](https://github.com/nasa-gibs/worldview/pull/2222)
- Fix jumpy slider [\#2219](https://github.com/nasa-gibs/worldview/pull/2219)
- 2193 fix NaN left property [\#2213](https://github.com/nasa-gibs/worldview/pull/2213)
- 2184 interval in permalink [\#2208](https://github.com/nasa-gibs/worldview/pull/2208)
- Add leftsetoffleftOffsetFixedCoeff parameter for timeline axis update [\#2199](https://github.com/nasa-gibs/worldview/pull/2199)
- Fix conditional vector style legend rendering [\#2195](https://github.com/nasa-gibs/worldview/pull/2195)
- Prevent axis update if dragging timeline or dragger [\#2194](https://github.com/nasa-gibs/worldview/pull/2194)
- Remove canvas, update documentation and travis-ci tests [\#2182](https://github.com/nasa-gibs/worldview/pull/2182)
- Dorian tour story [\#2179](https://github.com/nasa-gibs/worldview/pull/2179)
- Featured tab for geostationary layers\(and more\) [\#2177](https://github.com/nasa-gibs/worldview/pull/2177)
- Add geostationary imagery [\#2176](https://github.com/nasa-gibs/worldview/pull/2176)
- fixed incorrect snow product [\#2171](https://github.com/nasa-gibs/worldview/pull/2171)
- Prevent timeline scale update from new timelineEndDateLimit if animation is playing [\#2168](https://github.com/nasa-gibs/worldview/pull/2168)
- match sources before merging config with wtms from gc [\#2167](https://github.com/nasa-gibs/worldview/pull/2167)
- Dust storm story [\#2163](https://github.com/nasa-gibs/worldview/pull/2163)
- Update layer cache for subdaily layers if their datetime is recent [\#2161](https://github.com/nasa-gibs/worldview/pull/2161)
- removed inactive flag from oco-2 layers [\#2158](https://github.com/nasa-gibs/worldview/pull/2158)
- Fix worldfile option for image download [\#2156](https://github.com/nasa-gibs/worldview/pull/2156)
- Airs l2 nrt layers [\#2154](https://github.com/nasa-gibs/worldview/pull/2154)
- Subdaily img/gif download [\#2133](https://github.com/nasa-gibs/worldview/pull/2133)
- Date time snapping for subdaily "future" times [\#2130](https://github.com/nasa-gibs/worldview/pull/2130)
- Add space-before-function-paren never eslint rule [\#2124](https://github.com/nasa-gibs/worldview/pull/2124)
- Fix tour modal scroll area cut-off [\#2119](https://github.com/nasa-gibs/worldview/pull/2119)
- Added LSR descriptions [\#2118](https://github.com/nasa-gibs/worldview/pull/2118)
- Allow promise to resolve on no response for tilelayer grid building [\#2116](https://github.com/nasa-gibs/worldview/pull/2116)
- Update timeline scale with current time every minute [\#2113](https://github.com/nasa-gibs/worldview/pull/2113)
- Fix modis cloud [\#2112](https://github.com/nasa-gibs/worldview/pull/2112)
- Delete get-pip.py [\#2109](https://github.com/nasa-gibs/worldview/pull/2109)
- Add validation check for image download to see if available layers is an empty array [\#2107](https://github.com/nasa-gibs/worldview/pull/2107)
- Measure tool [\#2099](https://github.com/nasa-gibs/worldview/pull/2099)
- Add python3 to docker build [\#2097](https://github.com/nasa-gibs/worldview/pull/2097)
- updated text to include daily and new layer number [\#2092](https://github.com/nasa-gibs/worldview/pull/2092)
- Add wdpa layer [\#2091](https://github.com/nasa-gibs/worldview/pull/2091)
- added MODIS L3 Cryosphere descriptions; other fixes [\#2089](https://github.com/nasa-gibs/worldview/pull/2089)

## [v3.2.0-rc.5](https://github.com/nasa-gibs/worldview/tree/v3.2.0-rc.5) (2019-10-17)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.2.0-rc.4...v3.2.0-rc.5)

## Merged PRs:

- Activate imerg precipitation [\#2298](https://github.com/nasa-gibs/worldview/pull/2298)
- Allow custom interval widget to open when timeline is collapsed [\#2295](https://github.com/nasa-gibs/worldview/pull/2295)
- Update screenshot [\#2294](https://github.com/nasa-gibs/worldview/pull/2294)
- Disable thresholding and palette adjustment for the clean infrared layers [\#2293](https://github.com/nasa-gibs/worldview/pull/2293)
- Updated Red Visible filename [\#2292](https://github.com/nasa-gibs/worldview/pull/2292)
- Added GOES hyphen and updated tour article link [\#2278](https://github.com/nasa-gibs/worldview/pull/2278)
- Updated resolution text [\#2277](https://github.com/nasa-gibs/worldview/pull/2277)
- fix broken e2e tests [\#2269](https://github.com/nasa-gibs/worldview/pull/2269)
- IE11 Windows 8.1 and earlier - alert vertical alignment fix [\#2262](https://github.com/nasa-gibs/worldview/pull/2262)

## [v3.2.0-rc.4](https://github.com/nasa-gibs/worldview/tree/v3.2.0-rc.4) (2019-10-10)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.2.0-rc.3...v3.2.0-rc.4)

## Implemented Enhancements:

- Change displayed units [\#1196](https://github.com/nasa-gibs/worldview/issues/1196)

## Merged PRs:

- Render legendEntries as legend instead of colormapEntries [\#2263](https://github.com/nasa-gibs/worldview/pull/2263)
- give flex-basis property in IE a value so it will flex properly [\#2260](https://github.com/nasa-gibs/worldview/pull/2260)
- Remove temporary sources that pointed to GIBS UAT for subdaily [\#2258](https://github.com/nasa-gibs/worldview/pull/2258)
- Clear animation queue when animation stops [\#2257](https://github.com/nasa-gibs/worldview/pull/2257)
- Close layer settings modal on tab switch [\#2253](https://github.com/nasa-gibs/worldview/pull/2253)
- Fix no results text cut off [\#2252](https://github.com/nasa-gibs/worldview/pull/2252)
- Measure tool modal on mobile [\#2251](https://github.com/nasa-gibs/worldview/pull/2251)
- use the clickable-behind-modal class and remove invalid prop [\#2239](https://github.com/nasa-gibs/worldview/pull/2239)

## [v3.2.0-rc.3](https://github.com/nasa-gibs/worldview/tree/v3.2.0-rc.3) (2019-10-08)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.2.0-rc.2...v3.2.0-rc.3)

## Technical Updates / Bugfixes:

- URL crashes Worldview - may be related to too many layers or a specific set of layers [\#2145](https://github.com/nasa-gibs/worldview/issues/2145)

## Merged PRs:

- Center bar in running data triangle \(firefox\) [\#2236](https://github.com/nasa-gibs/worldview/pull/2236)
- Allow click behind animation preload modal [\#2235](https://github.com/nasa-gibs/worldview/pull/2235)
- Restart tour on arriving via permalink to a specific step \(other than the first\) [\#2228](https://github.com/nasa-gibs/worldview/pull/2228)
- Only show gif creation button tooltip on button hover [\#2212](https://github.com/nasa-gibs/worldview/pull/2212)

## [v3.2.0-rc.2](https://github.com/nasa-gibs/worldview/tree/v3.2.0-rc.2) (2019-10-03)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.2.0-rc.1...v3.2.0-rc.2)

## Merged PRs:

- fix issue with calculating extents from set limits [\#2205](https://github.com/nasa-gibs/worldview/pull/2205)

## [v3.2.0-rc.1](https://github.com/nasa-gibs/worldview/tree/v3.2.0-rc.1) (2019-10-03)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.1.0...v3.2.0-rc.1)

## Technical Updates / Bugfixes:

- A copied link when pasted into email or word shows a black background [\#1938](https://github.com/nasa-gibs/worldview/issues/1938)

## External Dependency Updates:

- Overzoom vectors with Openlayers 6 [\#1708](https://github.com/nasa-gibs/worldview/issues/1708)
- Bump webpack from 4.39.1 to 4.39.3 [\#2074](https://github.com/nasa-gibs/worldview/pull/2074)
- \[Security\] Bump eslint-utils from 1.4.0 to 1.4.2 [\#2072](https://github.com/nasa-gibs/worldview/pull/2072)
- Bump reactstrap from 8.0.0 to 8.0.1 [\#2027](https://github.com/nasa-gibs/worldview/pull/2027)
- Bump precss from 3.1.2 to 4.0.0 [\#2015](https://github.com/nasa-gibs/worldview/pull/2015)
- Bump bluebird from 3.4.6 to 3.5.5 [\#2008](https://github.com/nasa-gibs/worldview/pull/2008)
- Bump node-ssh from 5.1.2 to 6.0.0 [\#2007](https://github.com/nasa-gibs/worldview/pull/2007)
- Bump @babel/preset-env from 7.4.5 to 7.5.5 [\#2006](https://github.com/nasa-gibs/worldview/pull/2006)

## Closed Issues:

- Dependabot needs permission to see redux-location-state [\#2095](https://github.com/nasa-gibs/worldview/issues/2095)
- Headless e2e tests [\#2031](https://github.com/nasa-gibs/worldview/issues/2031)
- Ignore Time Validation Debug Flag [\#2020](https://github.com/nasa-gibs/worldview/issues/2020)
- Create WV Test Instance with Sedac [\#1713](https://github.com/nasa-gibs/worldview/issues/1713)

## Merged PRs:

- Add the geographic source for a number of default and commonly tested layers [\#2204](https://github.com/nasa-gibs/worldview/pull/2204)
- Animations layer caching  [\#2202](https://github.com/nasa-gibs/worldview/pull/2202)
- Geostationary notice modal [\#2178](https://github.com/nasa-gibs/worldview/pull/2178)
- Calculate layer extent from tile matrix limits [\#2151](https://github.com/nasa-gibs/worldview/pull/2151)
- Update documentation for wrap parameters [\#2073](https://github.com/nasa-gibs/worldview/pull/2073)
- Port to python3 [\#1959](https://github.com/nasa-gibs/worldview/pull/1959)

## [v3.1.0](https://github.com/nasa-gibs/worldview/tree/v3.1.0) (2019-08-27)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.1.0-rc.2...v3.1.0)

## Implemented Enhancements:

- Investigate wrapping of geostationary imagery around the antimeridian [\#1690](https://github.com/nasa-gibs/worldview/issues/1690)
- Add "today" button between date changer arrows [\#516](https://github.com/nasa-gibs/worldview/issues/516)
- Add Aeronet sites [\#130](https://github.com/nasa-gibs/worldview/issues/130)
- Add basic unit test code coverage reports [\#1973](https://github.com/nasa-gibs/worldview/issues/1973)
- Improve Travis-CI continuous integration [\#1777](https://github.com/nasa-gibs/worldview/issues/1777)
- Fix B-state layer & date init [\#2036](https://github.com/nasa-gibs/worldview/pull/2036)
- Bump all eslint dependencies [\#1993](https://github.com/nasa-gibs/worldview/pull/1993)
- Add basic jest code coverage [\#1974](https://github.com/nasa-gibs/worldview/pull/1974)
- Optimize static imagery for page load time savings [\#1967](https://github.com/nasa-gibs/worldview/pull/1967)

## Technical Updates / Bugfixes:

- Android Chrome new tab vs direct click permalink discrepancy \[perm.in.pal.1\] [\#1280](https://github.com/nasa-gibs/worldview/issues/1280)
- Large GIFs are hanging in requesting imagery stage [\#2063](https://github.com/nasa-gibs/worldview/issues/2063)
- Worldview embedded into storymap does not load [\#2058](https://github.com/nasa-gibs/worldview/issues/2058)
- Image dimensions are incorrect for resolution and black image returned on valid request [\#2045](https://github.com/nasa-gibs/worldview/issues/2045)
- Clicking Start using Worldview doesn't exit out of the tour dialog [\#2039](https://github.com/nasa-gibs/worldview/issues/2039)
- IE11 tour styles not being applied [\#2038](https://github.com/nasa-gibs/worldview/issues/2038)
- Can't ESC out of tour / splash [\#2034](https://github.com/nasa-gibs/worldview/issues/2034)
- Default image/gif download crop box displays improperly [\#2032](https://github.com/nasa-gibs/worldview/issues/2032)
- Starting fire tour while in polar projection causes crash [\#2023](https://github.com/nasa-gibs/worldview/issues/2023)
- Vector styles and data unable to parse layer identifiers containing periods [\#2012](https://github.com/nasa-gibs/worldview/issues/2012)
- Disabled natural events feature makes data request [\#1994](https://github.com/nasa-gibs/worldview/issues/1994)
- Comparison Mode "B" layers don't load in some cases [\#1965](https://github.com/nasa-gibs/worldview/issues/1965)
- Tests on develop breaking [\#1962](https://github.com/nasa-gibs/worldview/issues/1962)
- Clicking on event icon in IOS does not animate map to event \[events.notfocus.2\]  [\#1922](https://github.com/nasa-gibs/worldview/issues/1922)
- End tour to set isActive as false and close dialog [\#2050](https://github.com/nasa-gibs/worldview/pull/2050)
- Prevent event track from showing up when not in events mode [\#1955](https://github.com/nasa-gibs/worldview/pull/1955)
- Add options to fix copy-to-clipboard copied text format [\#1947](https://github.com/nasa-gibs/worldview/pull/1947)

## External Dependency Updates:

- Bump browserstack-capabilities from 0.4.0 to 0.7.0 [\#2019](https://github.com/nasa-gibs/worldview/pull/2019)
- Bump sass-loader from 7.1.0 to 7.2.0 [\#2009](https://github.com/nasa-gibs/worldview/pull/2009)
- Bump react from 16.8.6 to 16.9.0 [\#2004](https://github.com/nasa-gibs/worldview/pull/2004)
- Bump file-loader from 1.1.11 to 4.2.0 [\#1992](https://github.com/nasa-gibs/worldview/pull/1992)
- Bump nightwatch from 0.9.16 to 1.1.13 [\#1990](https://github.com/nasa-gibs/worldview/pull/1990)
- Bump express from 4.15.2 to 4.17.1 [\#1989](https://github.com/nasa-gibs/worldview/pull/1989)
- Bump lodash from 4.17.13 to 4.17.15 [\#1986](https://github.com/nasa-gibs/worldview/pull/1986)
- Bump regenerator-runtime from 0.13.2 to 0.13.3 [\#1985](https://github.com/nasa-gibs/worldview/pull/1985)
- Bump postcss-cli from 4.1.1 to 6.1.3 [\#1984](https://github.com/nasa-gibs/worldview/pull/1984)
- Bump url-loader from 1.1.2 to 2.1.0 [\#1983](https://github.com/nasa-gibs/worldview/pull/1983)
- Bump react-beautiful-dnd from 9.0.2 to 11.0.5 [\#1982](https://github.com/nasa-gibs/worldview/pull/1982)
- Bump webpack from 4.38.0 to 4.39.1 [\#1972](https://github.com/nasa-gibs/worldview/pull/1972)
- Bump css-loader from 1.0.1 to 3.2.0 [\#1971](https://github.com/nasa-gibs/worldview/pull/1971)
- Bump promise-queue from 2.2.3 to 2.2.5 [\#1961](https://github.com/nasa-gibs/worldview/pull/1961)
- Bump postcss-import from 11.1.0 to 12.0.1 [\#1960](https://github.com/nasa-gibs/worldview/pull/1960)
- Bump @fortawesome/fontawesome-free from 5.9.0 to 5.10.1 [\#1952](https://github.com/nasa-gibs/worldview/pull/1952)
- Bump fetch-mock from 7.3.3 to 7.3.9 [\#1951](https://github.com/nasa-gibs/worldview/pull/1951)
- Bump copy-webpack-plugin from 4.6.0 to 5.0.4 [\#1945](https://github.com/nasa-gibs/worldview/pull/1945)
- Bump uglifyjs-webpack-plugin from 1.3.0 to 2.2.0 [\#1944](https://github.com/nasa-gibs/worldview/pull/1944)
- Bump redux-location-state from `050ab73` to `4e81314` [\#1943](https://github.com/nasa-gibs/worldview/pull/1943)
- \[Security\] Bump lodash from 4.17.11 to 4.17.13 [\#1942](https://github.com/nasa-gibs/worldview/pull/1942)
- Bump chromedriver from 2.46.0 to 76.0.0 [\#1937](https://github.com/nasa-gibs/worldview/pull/1937)
- Bump webpack from 4.35.0 to 4.38.0 [\#1936](https://github.com/nasa-gibs/worldview/pull/1936)
- Bump clean-webpack-plugin from 0.1.19 to 3.0.0 [\#1935](https://github.com/nasa-gibs/worldview/pull/1935)
- \[Security\] Bump lodash.template from 4.4.0 to 4.5.0 [\#1934](https://github.com/nasa-gibs/worldview/pull/1934)
- \[Security\] Bump lodash.mergewith from 4.6.1 to 4.6.2 [\#1933](https://github.com/nasa-gibs/worldview/pull/1933)
- Bump react from 16.4.2 to 16.8.6 [\#1932](https://github.com/nasa-gibs/worldview/pull/1932)

## Closed Issues:

- Improve message for natural events in the event of EONET outage/maintenance [\#1727](https://github.com/nasa-gibs/worldview/issues/1727)
- Consider providing unique URLs to each step of the tour [\#1725](https://github.com/nasa-gibs/worldview/issues/1725)
- Color pallete custom scroll area aliasing on larger monitor [\#1665](https://github.com/nasa-gibs/worldview/issues/1665)
- Consider clarifying "Imagery Use" directions for image-download vs deep links [\#1541](https://github.com/nasa-gibs/worldview/issues/1541)
- Snapshot feature for standalone worldview installations... [\#1388](https://github.com/nasa-gibs/worldview/issues/1388)
- Support metadata with WMTS Raster [\#835](https://github.com/nasa-gibs/worldview/issues/835)
- Investigate how to communicate missing data/tiles/dataset down [\#643](https://github.com/nasa-gibs/worldview/issues/643)
- Underscores in MOD\_L2 descriptions show text as italics [\#2055](https://github.com/nasa-gibs/worldview/issues/2055)
- Can't scroll down in window for long layer descriptions [\#2054](https://github.com/nasa-gibs/worldview/issues/2054)
- Subdaily image download zeroing time parameter [\#2051](https://github.com/nasa-gibs/worldview/issues/2051)
- Investigate/remove javascript:void\(null\) for future React version blocking [\#2047](https://github.com/nasa-gibs/worldview/issues/2047)
- Documentation updates for Sea Surface Salinity products [\#2024](https://github.com/nasa-gibs/worldview/issues/2024)
- Sub-daily polish [\#1941](https://github.com/nasa-gibs/worldview/issues/1941)
- Anti-meridian crossings with image download [\#1940](https://github.com/nasa-gibs/worldview/issues/1940)
- Add MODIS Atmosphere \(Polar, 1.6um, 1621 Algorithm\) Layers [\#1904](https://github.com/nasa-gibs/worldview/issues/1904)
- Add IMERG Precipitation Rate [\#1895](https://github.com/nasa-gibs/worldview/issues/1895)
- Add detailed titles in natural event tooltips when hovered [\#1645](https://github.com/nasa-gibs/worldview/issues/1645)

## Merged PRs:

- v3.1.0 [\#2076](https://github.com/nasa-gibs/worldview/pull/2076)
-  Prevent gif download with too many frames [\#2067](https://github.com/nasa-gibs/worldview/pull/2067)
- Fixed SSS descriptions and product names [\#2066](https://github.com/nasa-gibs/worldview/pull/2066)
- Scroll layer descriptions [\#2065](https://github.com/nasa-gibs/worldview/pull/2065)
- Make sure we check to see if localStorage is accessible before trying to access it [\#2061](https://github.com/nasa-gibs/worldview/pull/2061)
- Remove any href attrs from anchor elements where the value included 'javascript:' [\#2060](https://github.com/nasa-gibs/worldview/pull/2060)
- Add projection param to all stepLinks for new fires tour [\#2059](https://github.com/nasa-gibs/worldview/pull/2059)
- Put tics around MODIS product names [\#2056](https://github.com/nasa-gibs/worldview/pull/2056)
- Allow subdaily layer image download to retain subdaily time and prevent zeroing [\#2052](https://github.com/nasa-gibs/worldview/pull/2052)
- Add empty format options to clipboard copy for IE11 [\#2049](https://github.com/nasa-gibs/worldview/pull/2049)
- Limit subdaily date range to one hour before and after current date [\#2044](https://github.com/nasa-gibs/worldview/pull/2044)
- Make esc button exit tour  [\#2040](https://github.com/nasa-gibs/worldview/pull/2040)
- Show event title on hover [\#2037](https://github.com/nasa-gibs/worldview/pull/2037)
- Automatically add labels to issues based on type \(bug, enhancement, feature\) [\#2035](https://github.com/nasa-gibs/worldview/pull/2035)
- Fix image/gif download crop boxes [\#2033](https://github.com/nasa-gibs/worldview/pull/2033)
- headless e2e testing [\#2022](https://github.com/nasa-gibs/worldview/pull/2022)
- fix eslint errors [\#2021](https://github.com/nasa-gibs/worldview/pull/2021)
- Fix layerIds that have dot notation to allow object property selection [\#2018](https://github.com/nasa-gibs/worldview/pull/2018)
- Render metadata tooltips as HTML [\#2014](https://github.com/nasa-gibs/worldview/pull/2014)
- Fix vector layer ids with periods breaking vector styles/data [\#2013](https://github.com/nasa-gibs/worldview/pull/2013)
- Allow configuration to have no products defined [\#2011](https://github.com/nasa-gibs/worldview/pull/2011)
- Add MODIS Atmosphere layers [\#2010](https://github.com/nasa-gibs/worldview/pull/2010)
- Empty ows:Metadata, part 2 [\#2005](https://github.com/nasa-gibs/worldview/pull/2005)
- Antimeridian crossing image/GIF download [\#1998](https://github.com/nasa-gibs/worldview/pull/1998)
- Subdaily polish [\#1997](https://github.com/nasa-gibs/worldview/pull/1997)
- Prevent disabled data download or natural events feature components from building [\#1995](https://github.com/nasa-gibs/worldview/pull/1995)
- Use zeroed times for data download time filtering [\#1988](https://github.com/nasa-gibs/worldview/pull/1988)
- Optimize travis-ci builds [\#1979](https://github.com/nasa-gibs/worldview/pull/1979)
- 1975 bring in postcss-nesting plugin [\#1978](https://github.com/nasa-gibs/worldview/pull/1978)
- added IMERG Precipitation rate [\#1977](https://github.com/nasa-gibs/worldview/pull/1977)
- Update postcss / cssnano dependencies & webpack config [\#1970](https://github.com/nasa-gibs/worldview/pull/1970)
- Remove unused variable [\#1963](https://github.com/nasa-gibs/worldview/pull/1963)
- Scroll to selected event in sidebar on click [\#1958](https://github.com/nasa-gibs/worldview/pull/1958)
- Refactor import to fix console error [\#1957](https://github.com/nasa-gibs/worldview/pull/1957)
- Add multiple node versions and windows distro to .travis.yml [\#1946](https://github.com/nasa-gibs/worldview/pull/1946)
- Event click mobile device \[v3.1\] [\#1924](https://github.com/nasa-gibs/worldview/pull/1924)

## [v3.1.0-rc.2](https://github.com/nasa-gibs/worldview/tree/v3.1.0-rc.2) (2019-08-21)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.1.0-rc.1...v3.1.0-rc.2)

## Implemented Enhancements:

- Event e2e source-link test to use mock data [\#1055](https://github.com/nasa-gibs/worldview/issues/1055)

## Technical Updates / Bugfixes:

- Image download/take a snapshot draws an incorrect bounding box [\#2053](https://github.com/nasa-gibs/worldview/issues/2053)

## [v3.1.0-rc.1](https://github.com/nasa-gibs/worldview/tree/v3.1.0-rc.1) (2019-08-13)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.0.0...v3.1.0-rc.1)

## Implemented Enhancements:

- Add a contrasting color to the swipe line and circle [\#1609](https://github.com/nasa-gibs/worldview/issues/1609)
- Implement better mobile detection [\#709](https://github.com/nasa-gibs/worldview/issues/709)

## Technical Updates / Bugfixes:

- Copy Link To Share doesn't copy for IE11 [\#2046](https://github.com/nasa-gibs/worldview/issues/2046)
- MODIS data download swaths have incorrect coverage and dates/times [\#1980](https://github.com/nasa-gibs/worldview/issues/1980)
- Worldview stops working when layer name has periods [\#1976](https://github.com/nasa-gibs/worldview/issues/1976)
- Events tracks can appear when Events tab is not active [\#1954](https://github.com/nasa-gibs/worldview/issues/1954)
- Replace 'createBrowserHistory' with new import syntax [\#1953](https://github.com/nasa-gibs/worldview/issues/1953)
- Clicking on an event on the map does not move that listing in the Event list [\#1948](https://github.com/nasa-gibs/worldview/issues/1948)
- Animation seems to hang when you change the end date to yesterday [\#1811](https://github.com/nasa-gibs/worldview/issues/1811)
- Selecting custom colormap should stop animation [\#1600](https://github.com/nasa-gibs/worldview/issues/1600)
- Sometimes hovering over values on layers do not show the corresponding running data value in the colorbar [\#1080](https://github.com/nasa-gibs/worldview/issues/1080)
- Date field in timeline is not updating page data on click and mouse move \[date.field.11/perm.out.3\] [\#882](https://github.com/nasa-gibs/worldview/issues/882)

## Closed Issues:

- Bring in postcss-nesting/nested plugin to allow nesting CSS selectors [\#1975](https://github.com/nasa-gibs/worldview/issues/1975)
- Investigate migrating to Openlayers 6 [\#1923](https://github.com/nasa-gibs/worldview/issues/1923)
- Render vector metadata tooltip data as HTML [\#1916](https://github.com/nasa-gibs/worldview/issues/1916)
- On startup with sub-daily layers, default to most recent time of day [\#1734](https://github.com/nasa-gibs/worldview/issues/1734)
- Replace or remove deployment.md documentation [\#1724](https://github.com/nasa-gibs/worldview/issues/1724)
- Taking image snapshot that includes a layer with no coverage shows service exception text [\#1706](https://github.com/nasa-gibs/worldview/issues/1706)
- Tooltip Above date input [\#1659](https://github.com/nasa-gibs/worldview/issues/1659)
- Animation playback interval should default to current timeline interval [\#1612](https://github.com/nasa-gibs/worldview/issues/1612)
- Consider using OMI/OMPS Sulfur Dioxide as default for volcanic events [\#1052](https://github.com/nasa-gibs/worldview/issues/1052)
- Improve continuous integration speed [\#763](https://github.com/nasa-gibs/worldview/issues/763)

## [v3.0.0](https://github.com/nasa-gibs/worldview/tree/v3.0.0) (2019-08-01)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.0.0-rc.7...v3.0.0)

## Implemented Enhancements:

- Collapse layer list and timeline when selecting image to download [\#1619](https://github.com/nasa-gibs/worldview/issues/1619)
- Remove "List All" function on the Events tab [\#1554](https://github.com/nasa-gibs/worldview/issues/1554)
- Display extended vector information from GIBS provided JSON [\#739](https://github.com/nasa-gibs/worldview/issues/739)

## Technical Updates / Bugfixes:

- Tour is breaking when layer is thresholded/squashed [\#1925](https://github.com/nasa-gibs/worldview/issues/1925)
- Timeline axis disappears on certain drags \(UAT v3.0\) [\#1914](https://github.com/nasa-gibs/worldview/issues/1914)
- Unchecking Include date stamps does not remove date stamps \(UAT v3.0\) [\#1909](https://github.com/nasa-gibs/worldview/issues/1909)
- Animated GIF bounding box should remain in the same place/same size as the previous time you used it \(UAT v3.0\) [\#1908](https://github.com/nasa-gibs/worldview/issues/1908)
- Speed in downloaded Animated GIF does not vary \(UAT v3.0\) [\#1906](https://github.com/nasa-gibs/worldview/issues/1906)
- Clicking on event in sidebar does not select event and throws errors \(UAT v3.0\) [\#1905](https://github.com/nasa-gibs/worldview/issues/1905)
- Animation widget date selector breaks when no start/end date is present \(UAT v3.0\) [\#1903](https://github.com/nasa-gibs/worldview/issues/1903)
- Combination key + forward/backward keyboard shortcut moves the timeline [\#1899](https://github.com/nasa-gibs/worldview/issues/1899)
- Event tracks are not being built/destroyed properly on projection switch \(UAT v3.0\) [\#1898](https://github.com/nasa-gibs/worldview/issues/1898)
- Event tracks are not retained when switching projections \(UAT v3.0\) [\#1893](https://github.com/nasa-gibs/worldview/issues/1893)
- IE11 dragging swiper in comparison mode selects other DOM elements [\#1888](https://github.com/nasa-gibs/worldview/issues/1888)
- Supercluster points not always removed after clicking to zoom in [\#1885](https://github.com/nasa-gibs/worldview/issues/1885)
- Creating GIF out of memory error \[id.gif.1\] [\#1882](https://github.com/nasa-gibs/worldview/issues/1882)
- Image download panel shows maximum based on MB instead of Pixels \(UAT v3.0\) [\#1881](https://github.com/nasa-gibs/worldview/issues/1881)
- Dragger may be in the wrong position after initiating comparison mode when the tour is active \(UAT v3.0\) [\#1880](https://github.com/nasa-gibs/worldview/issues/1880)
- Event track dates do not change consistently after clicking supercluster [\#1871](https://github.com/nasa-gibs/worldview/issues/1871)
- Animation widget should select the timeline date as the start date and end date should be 7 days forward \(UAT v3.0\) [\#1869](https://github.com/nasa-gibs/worldview/issues/1869)
- Animation dates should update with timeline dates in tour story \(UAT v3.0\) [\#1868](https://github.com/nasa-gibs/worldview/issues/1868)
- Feedback module does not open in mobile \(UAT V3.0\) [\#1867](https://github.com/nasa-gibs/worldview/issues/1867)
- If date text boxes are selected, left/right arrows should move text cursor not increment the date \[date.input.3\] [\#1866](https://github.com/nasa-gibs/worldview/issues/1866)
- Timeline pick should select every day when "scrubbing" \[date.pick.7\] [\#1865](https://github.com/nasa-gibs/worldview/issues/1865)
- Layer palette colorbar doesn't extend full width of mobile sidebar \(UAT v3.0\) [\#1864](https://github.com/nasa-gibs/worldview/issues/1864)
- Links in toolbar modal are underlined \(SIT v3.0\) [\#1858](https://github.com/nasa-gibs/worldview/issues/1858)
- Timeline is not updating when selecting an event \(SIT v3.0\) [\#1852](https://github.com/nasa-gibs/worldview/issues/1852)
- Non polar layer data swaths are available to select in polar projection \[dd.polar.9\] \(SIT v3.0\) [\#1847](https://github.com/nasa-gibs/worldview/issues/1847)
- Clicking "List of Links" or "List of cURL Commands" removes swath '+' buttons \[dd.wget.1\] \(SIT v3.0\) [\#1846](https://github.com/nasa-gibs/worldview/issues/1846)
- Data download intermittent issue can't remove selected data swath \(SIT v3.0\) [\#1845](https://github.com/nasa-gibs/worldview/issues/1845)
- Able to download a rotated image in polar projection \(SIT v3.0\) [\#1840](https://github.com/nasa-gibs/worldview/issues/1840)
- TypeError on clicking event track supercluster and/or points \(not consistent\) \(SIT v3.0\) [\#1838](https://github.com/nasa-gibs/worldview/issues/1838)
- Animation range/draggers update in wrong position on play \[date.animation.3\] \(SIT v3.0\) [\#1835](https://github.com/nasa-gibs/worldview/issues/1835)
- URL parameter time is ignored \(SIT v3.0\) [\#1834](https://github.com/nasa-gibs/worldview/issues/1834)
- Unable to click up arrows on date selector when custom interval widget is open \(SIT v3.0\) [\#1833](https://github.com/nasa-gibs/worldview/issues/1833)
- Map should re-render with opposing views when switching from A to B tabs in spy mode\[compare.spy.4\] [\#1832](https://github.com/nasa-gibs/worldview/issues/1832)
- Track line for TC Barbara doesn't show up on first load  [\#1831](https://github.com/nasa-gibs/worldview/issues/1831)
- Adding three layers then refreshing the page does not reload with the same layers \[perm.out.2, perm.out.4, perm.out.5, perm.out.7\] [\#1830](https://github.com/nasa-gibs/worldview/issues/1830)
- While on data download tab in geographic and switching to Arctic then Antarctic and back to Geo, granule buttons/lines don't appear in the projections \[dd.polar.15\] [\#1829](https://github.com/nasa-gibs/worldview/issues/1829)
- Keyboard is opened when selecting Add Layers on mobile [\#1823](https://github.com/nasa-gibs/worldview/issues/1823)
- IE11 Object doesn't support property or method 'assign' \(SIT v3.0\) [\#1819](https://github.com/nasa-gibs/worldview/issues/1819)
- Map viewport url param value changes on refresh \(SIT v3.0\) [\#1817](https://github.com/nasa-gibs/worldview/issues/1817)
- Selected two granules from MODIS/Terra AOD then removed layer but granule outlines still present\[dd.sel.16\] [\#1816](https://github.com/nasa-gibs/worldview/issues/1816)
- Grey granule footprint does not appear when you've clicked on a granule \[dd.sel.7\] [\#1815](https://github.com/nasa-gibs/worldview/issues/1815)
- Dialog box for non downloadable data does not open when you click on question mark \[dd.nav.16\] [\#1814](https://github.com/nasa-gibs/worldview/issues/1814)
- When the settings panel is open, it requires two clicks to get to Events tab \[setting.nav.6\] [\#1812](https://github.com/nasa-gibs/worldview/issues/1812)
- Map should only display current day's imagery when image download panel is open \[id.nav.16\] [\#1810](https://github.com/nasa-gibs/worldview/issues/1810)
- When you adjust/move the image download selection box, close the modal, and open again, the selection box does not retain previous location/size\[id.nav.14\] [\#1808](https://github.com/nasa-gibs/worldview/issues/1808)
- Disable sidebar settings / descriptions on mobile [\#1807](https://github.com/nasa-gibs/worldview/issues/1807)
- When making browser smaller, layer list should collapse and show "Layers \(6\)" \[layer.mob.resp.2\] [\#1806](https://github.com/nasa-gibs/worldview/issues/1806)
- Tour alert does not display when checking "Do not show until a new story has been added" [\#1805](https://github.com/nasa-gibs/worldview/issues/1805)
- Map does not initiate in the eastern hemisphere/Africa \[map.init.9 and map.init.10\] [\#1799](https://github.com/nasa-gibs/worldview/issues/1799)
- Accessing a non-existent tour via URL does not provide a notification \[tour.link.12\] [\#1798](https://github.com/nasa-gibs/worldview/issues/1798)
- When in a tour, the in-progress modal does not close and the startup modal does not open when you click on Explore Worldview \[tour.story.5 and tour.state.6\] [\#1797](https://github.com/nasa-gibs/worldview/issues/1797)
- Tour is visible when the browser is mobile sized \(SIT v3.0\) [\#1796](https://github.com/nasa-gibs/worldview/issues/1796)
- Invalid palette threshold number in URL crashes app \[perm.in.th.4\] [\#1795](https://github.com/nasa-gibs/worldview/issues/1795)
- Data download is displaying downloadable data on the map when that layer is not in the layer list \[perm.in.dd.3\] [\#1794](https://github.com/nasa-gibs/worldview/issues/1794)
- Data download tab should not be selected if invalid product selected \[perm.in.dd.2\] [\#1793](https://github.com/nasa-gibs/worldview/issues/1793)
- Invalid projection in URL crashes app - Worldview does not display anything \[perm.in.proj.7\] [\#1792](https://github.com/nasa-gibs/worldview/issues/1792)
- Time slider should show Mar 15, 2013 but shows Mar 16, 2013 \[perm.in.date.3\] [\#1791](https://github.com/nasa-gibs/worldview/issues/1791)
- Time slider should show Jan 1, 1948, instead it shows 1900 Jan 1 \[perm.in.date.2\]  [\#1790](https://github.com/nasa-gibs/worldview/issues/1790)
- Coastlines subtitle does not display \(SIT v3.0\) [\#1786](https://github.com/nasa-gibs/worldview/issues/1786)
- Temporal coverage in layer description has incorrect characters/missing dash for layers with an end date \(SIT v3.0\) [\#1785](https://github.com/nasa-gibs/worldview/issues/1785)
- Running data is not working \(SIT v3.0\) [\#1784](https://github.com/nasa-gibs/worldview/issues/1784)
- Default layers are not being added with Events \(SIT v3.0\) [\#1783](https://github.com/nasa-gibs/worldview/issues/1783)
- Breadcrumb is missing from Layer Picker \(SIT v3.0\) [\#1782](https://github.com/nasa-gibs/worldview/issues/1782)
- When changing from rotated imagery in Arctic/Antarctic to Geographic and you try to take a pic or make a GIF, the rotation notification box appears \(SIT v3.0\) [\#1780](https://github.com/nasa-gibs/worldview/issues/1780)
- OK button not visible in the reset rotation animation notification box \(SIT v3.0\) [\#1779](https://github.com/nasa-gibs/worldview/issues/1779)
- Can't interact with Worldview features or map once you've started a tour story \(SIT v3.0\) [\#1778](https://github.com/nasa-gibs/worldview/issues/1778)
- When palette thresholds/opacity are set in comparison mode, reloading the URL causes WV to break [\#1731](https://github.com/nasa-gibs/worldview/issues/1731)
- External links should open in a new tab/window [\#1718](https://github.com/nasa-gibs/worldview/issues/1718)
- Date ranges not displaying correctly in the layer picker [\#1681](https://github.com/nasa-gibs/worldview/issues/1681)
- Palette thresholds and types aren't preserved when entering comparison mode [\#1666](https://github.com/nasa-gibs/worldview/issues/1666)
- Animation widget can remain active in comparison mode [\#1664](https://github.com/nasa-gibs/worldview/issues/1664)
- Fix vector style not being applied when changing date [\#1897](https://github.com/nasa-gibs/worldview/pull/1897)
- Update v3.0 tour modal styles to match v2.17 [\#1870](https://github.com/nasa-gibs/worldview/pull/1870)

## Closed Issues:

- Update images with timeline picks to show new guitar pick shape [\#1927](https://github.com/nasa-gibs/worldview/issues/1927)
- Timeline design UAT suggestions [\#1918](https://github.com/nasa-gibs/worldview/issues/1918)
- Pressing data-download tab while flying to event breaks App \(V3.0, UAT\) [\#1883](https://github.com/nasa-gibs/worldview/issues/1883)
- Share link modal offset in mobile \(SIT v3.0\) [\#1844](https://github.com/nasa-gibs/worldview/issues/1844)
- Update timeline/dragger related imagery for v3.0 release [\#1827](https://github.com/nasa-gibs/worldview/issues/1827)
- Compare mode alert text has non-breaking space \(SIT v3.0\) [\#1826](https://github.com/nasa-gibs/worldview/issues/1826)
- Add additional IE11 polyfills \(SIT v3.0\) [\#1825](https://github.com/nasa-gibs/worldview/issues/1825)
- Tour step dialog positioning is incorrect in IE11 \(SIT v3.0\) [\#1824](https://github.com/nasa-gibs/worldview/issues/1824)
- Add IMERG Rain and Snow back into Severe Storms Events [\#1804](https://github.com/nasa-gibs/worldview/issues/1804)
- Timeline not updating with tour step change [\#1802](https://github.com/nasa-gibs/worldview/issues/1802)
- Custom interval selector can go behind sidebar in compare mode \(SIT v3.0\) [\#1788](https://github.com/nasa-gibs/worldview/issues/1788)
- Typing into product picker with animation widget open can start controls \(SIT v3.0\) [\#1787](https://github.com/nasa-gibs/worldview/issues/1787)
- Timeline Technical updates [\#1774](https://github.com/nasa-gibs/worldview/issues/1774)
- Timeline UI updates [\#1773](https://github.com/nasa-gibs/worldview/issues/1773)
- Time selection updates [\#1771](https://github.com/nasa-gibs/worldview/issues/1771)
- v3.0.0 Bugs To Fix / Task To Complete [\#1755](https://github.com/nasa-gibs/worldview/issues/1755)
- Overhauled timeline should display day of year in tooltip [\#1736](https://github.com/nasa-gibs/worldview/issues/1736)
- Use `maxLabel` and `minLabel` attributes in setting widget [\#1726](https://github.com/nasa-gibs/worldview/issues/1726)
- Create WV Test Instance with Orbit Tracks [\#1712](https://github.com/nasa-gibs/worldview/issues/1712)
- Save vector style & filter settings state / URL [\#1710](https://github.com/nasa-gibs/worldview/issues/1710)
- Add vector style to sidebar layer settings UI [\#1709](https://github.com/nasa-gibs/worldview/issues/1709)
- Tour disappears when the browser height is 610px [\#1678](https://github.com/nasa-gibs/worldview/issues/1678)
- Consider separating MODIS fires out into 3 layers: Day, Night and Combined [\#1650](https://github.com/nasa-gibs/worldview/issues/1650)
- Add vector point filtering capabilities [\#1631](https://github.com/nasa-gibs/worldview/issues/1631)
- Make existing react components use redux [\#1623](https://github.com/nasa-gibs/worldview/issues/1623)
- Replace remaining jQuery with react/redux [\#1622](https://github.com/nasa-gibs/worldview/issues/1622)
- Implement toolbar in redux [\#1576](https://github.com/nasa-gibs/worldview/issues/1576)
- Coordinate labels in image download box should be unselectable [\#1547](https://github.com/nasa-gibs/worldview/issues/1547)
- Enhanced Timeline Redesign  [\#1496](https://github.com/nasa-gibs/worldview/issues/1496)
- Upgrade to Babel 7 [\#1466](https://github.com/nasa-gibs/worldview/issues/1466)
- Replace mobiscroll for mobile timewheels [\#757](https://github.com/nasa-gibs/worldview/issues/757)
- Create vector metadata modal & tooltips [\#560](https://github.com/nasa-gibs/worldview/issues/560)

## Merged PRs:

- v3.0.0 [\#1929](https://github.com/nasa-gibs/worldview/pull/1929)
- 1927 replace images that show the guitar pick with new ones [\#1928](https://github.com/nasa-gibs/worldview/pull/1928)
- Update gif component to store crop boundaries state  [\#1921](https://github.com/nasa-gibs/worldview/pull/1921)
- UAT development/design meeting timeline style fixes [\#1920](https://github.com/nasa-gibs/worldview/pull/1920)
- Update grid axis drag sentinel count with boundsDiff taken into account [\#1917](https://github.com/nasa-gibs/worldview/pull/1917)
- MODIS L3 descriptions [\#1901](https://github.com/nasa-gibs/worldview/pull/1901)
- Added fire tour story [\#1894](https://github.com/nasa-gibs/worldview/pull/1894)
- Fix supercluster overlays sometimes not being removed when zooming in [\#1892](https://github.com/nasa-gibs/worldview/pull/1892)
- Fix image download and GIF download size problems [\#1890](https://github.com/nasa-gibs/worldview/pull/1890)
- Dragger timeline UAT fixes - fix wrong date for compare mode while in tour, allow date scrubbing, and clean up state [\#1876](https://github.com/nasa-gibs/worldview/pull/1876)
- Separate MODIS Day/Night Fires [\#1873](https://github.com/nasa-gibs/worldview/pull/1873)
- v3.0 cleanup unused files [\#1872](https://github.com/nasa-gibs/worldview/pull/1872)
- Add missing vector-filter utilities and actions [\#1863](https://github.com/nasa-gibs/worldview/pull/1863)
- Fix compare/timeline-test errors related to dragger x position [\#1862](https://github.com/nasa-gibs/worldview/pull/1862)
- Update worldview images [\#1861](https://github.com/nasa-gibs/worldview/pull/1861)
- Fix condition to change dragger position on natural event date change [\#1860](https://github.com/nasa-gibs/worldview/pull/1860)
- Account for legacy parameters and add unit tests [\#1859](https://github.com/nasa-gibs/worldview/pull/1859)
- Prevent downloading rotated images [\#1857](https://github.com/nasa-gibs/worldview/pull/1857)
- Adjust toolbar modal responsive positions [\#1856](https://github.com/nasa-gibs/worldview/pull/1856)
- Check data state at time of granule swath removal for currently selected granules [\#1853](https://github.com/nasa-gibs/worldview/pull/1853)
- Data download fixes [\#1851](https://github.com/nasa-gibs/worldview/pull/1851)
- Fix typo in testing.md [\#1850](https://github.com/nasa-gibs/worldview/pull/1850)
- Fix animation dragger not updating position correctly, fix dragger positioning from arrow date selector changes [\#1849](https://github.com/nasa-gibs/worldview/pull/1849)
- Style fixes for tour step and custom interval selector, fix timeline hide conditional [\#1848](https://github.com/nasa-gibs/worldview/pull/1848)
- Add full core-js es5,es6,es7 support for polyfills used in IE11 [\#1839](https://github.com/nasa-gibs/worldview/pull/1839)
- Updates to MODIS L3 metadata files and IMERG added back in [\#1836](https://github.com/nasa-gibs/worldview/pull/1836)
- V3.0 bug fixes \#3 [\#1828](https://github.com/nasa-gibs/worldview/pull/1828)
- Add core-js for IE11 polyfills [\#1822](https://github.com/nasa-gibs/worldview/pull/1822)
- V3.0 data download bugs [\#1821](https://github.com/nasa-gibs/worldview/pull/1821)
- Prevent animation from getting caught in endless loop [\#1820](https://github.com/nasa-gibs/worldview/pull/1820)
- Floor animation start and end dates to allow predictable animation/GIF ranges [\#1818](https://github.com/nasa-gibs/worldview/pull/1818)
- v3.0 SIT Timeline bug fixes 1 [\#1803](https://github.com/nasa-gibs/worldview/pull/1803)
- v3.0 SIT bug fixes \#2 [\#1801](https://github.com/nasa-gibs/worldview/pull/1801)
- Fix custom interval widget getting behind sidebar [\#1789](https://github.com/nasa-gibs/worldview/pull/1789)
- V3.0 bug fixes [\#1781](https://github.com/nasa-gibs/worldview/pull/1781)
- Redux for state management & Enhanced timeline capabilities [\#1769](https://github.com/nasa-gibs/worldview/pull/1769)
- Empty ows:Metadata [\#1763](https://github.com/nasa-gibs/worldview/pull/1763)
- Enhanced vector layer capabilities [\#1751](https://github.com/nasa-gibs/worldview/pull/1751)

## [v3.0.0-rc.7](https://github.com/nasa-gibs/worldview/tree/v3.0.0-rc.7) (2019-07-31)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.0.0-rc.6...v3.0.0-rc.7)

## Merged PRs:

- Wildfires tour bug UAT v3.0  [\#1926](https://github.com/nasa-gibs/worldview/pull/1926)

## [v3.0.0-rc.6](https://github.com/nasa-gibs/worldview/tree/v3.0.0-rc.6) (2019-07-29)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.0.0-rc.4...v3.0.0-rc.6)

## Implemented Enhancements:

- Fix IE11 selecting other DOM elements while dragging swiper in compare mode and cursor [\#1889](https://github.com/nasa-gibs/worldview/pull/1889)

## Merged PRs:

- Animation breaks when permalink has ab='on' without animation start and end dates [\#1919](https://github.com/nasa-gibs/worldview/pull/1919)
- Fix showing/hiding date stamp on gifs [\#1915](https://github.com/nasa-gibs/worldview/pull/1915)
- Fix animation speed in gifs [\#1913](https://github.com/nasa-gibs/worldview/pull/1913)
- Add GTM, add timeline e2e tests, and documentation updates/minor code cleanup [\#1912](https://github.com/nasa-gibs/worldview/pull/1912)
- Update event track projection handling  [\#1910](https://github.com/nasa-gibs/worldview/pull/1910)
- Prevent ctrl or cmd plus left/right timeline arrows from invoking change date function [\#1907](https://github.com/nasa-gibs/worldview/pull/1907)
- Prevent event track click error \#1838 [\#1902](https://github.com/nasa-gibs/worldview/pull/1902)
- Prevent data-download click while animating to event \#1883 [\#1900](https://github.com/nasa-gibs/worldview/pull/1900)
- Fix event tracks disappearing when switching projections [\#1896](https://github.com/nasa-gibs/worldview/pull/1896)
- Fix event track points not setting date correctly after clicking a supercluster \(or switching sidebar tabs\) [\#1887](https://github.com/nasa-gibs/worldview/pull/1887)
- Add colons to browser and version in issue template [\#1886](https://github.com/nasa-gibs/worldview/pull/1886)
- Add e2e tests for 'hide events not in view' functionality [\#1884](https://github.com/nasa-gibs/worldview/pull/1884)
- Make palette color bar extend full width in mobile [\#1879](https://github.com/nasa-gibs/worldview/pull/1879)
- Make mobile send feedback via email  [\#1878](https://github.com/nasa-gibs/worldview/pull/1878)
- Animation start/end date updates [\#1877](https://github.com/nasa-gibs/worldview/pull/1877)
- Prevent timeline left/right arrow event listener change when focused on input [\#1875](https://github.com/nasa-gibs/worldview/pull/1875)
- Fix external links in layer descriptions/stories not opening in new tabs [\#1874](https://github.com/nasa-gibs/worldview/pull/1874)

## [v3.0.0-rc.4](https://github.com/nasa-gibs/worldview/tree/v3.0.0-rc.4) (2019-07-17)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.0.0-rc.5...v3.0.0-rc.4)

## [v3.0.0-rc.5](https://github.com/nasa-gibs/worldview/tree/v3.0.0-rc.5) (2019-07-17)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.0.0-rc.3...v3.0.0-rc.5)

## [v3.0.0-rc.3](https://github.com/nasa-gibs/worldview/tree/v3.0.0-rc.3) (2019-07-11)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.0.0-rc.2...v3.0.0-rc.3)

## Technical Updates / Bugfixes:

- Timeline does not select 2013-MAR-14 with the test plan URL \[date.init.19\] [\#1800](https://github.com/nasa-gibs/worldview/issues/1800)

## Closed Issues:

- Animation dates don't zero out and restrict selected animation range \(SIT v3.0\) [\#1813](https://github.com/nasa-gibs/worldview/issues/1813)

## [v3.0.0-rc.2](https://github.com/nasa-gibs/worldview/tree/v3.0.0-rc.2) (2019-07-09)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v3.0.0-rc.1...v3.0.0-rc.2)

## [v3.0.0-rc.1](https://github.com/nasa-gibs/worldview/tree/v3.0.0-rc.1) (2019-07-02)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.17.0...v3.0.0-rc.1)

## [v2.17.0](https://github.com/nasa-gibs/worldview/tree/v2.17.0) (2019-06-26)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.16.2...v2.17.0)

## Implemented Enhancements:

- Running lat-lon doesn't work across the dateline [\#1671](https://github.com/nasa-gibs/worldview/issues/1671)

## Closed Issues:

- Update sunglint story [\#1764](https://github.com/nasa-gibs/worldview/issues/1764)
- Add SEDAC layers \(4\) [\#1761](https://github.com/nasa-gibs/worldview/issues/1761)
- Add MODIS L3 Layers [\#1759](https://github.com/nasa-gibs/worldview/issues/1759)
- Add OCO-2 layers \(6\) [\#1758](https://github.com/nasa-gibs/worldview/issues/1758)
- Change EOSDIS related links in the About section [\#1756](https://github.com/nasa-gibs/worldview/issues/1756)
- Change default severe storms events layers [\#1753](https://github.com/nasa-gibs/worldview/issues/1753)
- Update MOPITT L3 Description for V8 [\#1748](https://github.com/nasa-gibs/worldview/issues/1748)
- Transition AIRS L3 layer identifiers [\#1738](https://github.com/nasa-gibs/worldview/issues/1738)
- Better error handling for EONET [\#963](https://github.com/nasa-gibs/worldview/issues/963)

## Merged PRs:

- v2.17.0 [\#1768](https://github.com/nasa-gibs/worldview/pull/1768)
- Add modis l3 layers [\#1767](https://github.com/nasa-gibs/worldview/pull/1767)
- Update step002.md sunglint story [\#1765](https://github.com/nasa-gibs/worldview/pull/1765)
- Added 4 SEDAC layers [\#1762](https://github.com/nasa-gibs/worldview/pull/1762)
- added 6 oco-2 layers [\#1760](https://github.com/nasa-gibs/worldview/pull/1760)
- update storm layers and about links [\#1757](https://github.com/nasa-gibs/worldview/pull/1757)
- Update mopitt v8 [\#1752](https://github.com/nasa-gibs/worldview/pull/1752)
- Change AIRS L3 identifiers [\#1750](https://github.com/nasa-gibs/worldview/pull/1750)

## [v2.16.2](https://github.com/nasa-gibs/worldview/tree/v2.16.2) (2019-06-06)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.16.1...v2.16.2)

## Implemented Enhancements:

- Add socio-economic layers to Hazards and Disasters categories [\#1687](https://github.com/nasa-gibs/worldview/issues/1687)

## Technical Updates / Bugfixes:

- Within tour, if you are in the Pine Island Glacier tour and switch projections and advance a step, an error message occurs [\#1694](https://github.com/nasa-gibs/worldview/issues/1694)

## Closed Issues:

- Add AMSRU2 SWE Layer descriptions [\#1739](https://github.com/nasa-gibs/worldview/issues/1739)
- Add AMSRU2 SWE NRT Daily [\#1723](https://github.com/nasa-gibs/worldview/issues/1723)
- Add AMSRU SWE Monthly and 5day [\#1693](https://github.com/nasa-gibs/worldview/issues/1693)
- CERES v4 update [\#1686](https://github.com/nasa-gibs/worldview/issues/1686)

## Merged PRs:

- v2.16.2 [\#1746](https://github.com/nasa-gibs/worldview/pull/1746)
- Fix broken date selector in comparison mode [\#1745](https://github.com/nasa-gibs/worldview/pull/1745)
- Fix link errors [\#1744](https://github.com/nasa-gibs/worldview/pull/1744)
- Added AMSRU2 SWE descriptions [\#1740](https://github.com/nasa-gibs/worldview/pull/1740)

## [v2.16.1](https://github.com/nasa-gibs/worldview/tree/v2.16.1) (2019-05-29)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.16.0...v2.16.1)

## Merged PRs:

- rename category to Urban extents [\#1733](https://github.com/nasa-gibs/worldview/pull/1733)

## [v2.16.0](https://github.com/nasa-gibs/worldview/tree/v2.16.0) (2019-05-28)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.15.2...v2.16.0)

## Closed Issues:

- Palette squashing issue - mismatch at the max level [\#1720](https://github.com/nasa-gibs/worldview/issues/1720)
- Tour Story for May [\#1701](https://github.com/nasa-gibs/worldview/issues/1701)

## Merged PRs:

- v2.16.0 [\#1732](https://github.com/nasa-gibs/worldview/pull/1732)
- Add amsru swe [\#1730](https://github.com/nasa-gibs/worldview/pull/1730)
- Tour Story for May - sunglint [\#1728](https://github.com/nasa-gibs/worldview/pull/1728)
- Add se layers categories [\#1722](https://github.com/nasa-gibs/worldview/pull/1722)
- Update rm ceres layers [\#1719](https://github.com/nasa-gibs/worldview/pull/1719)
- Fix tour breaking when switching projections & using comparison feature [\#1703](https://github.com/nasa-gibs/worldview/pull/1703)

## [v2.15.2](https://github.com/nasa-gibs/worldview/tree/v2.15.2) (2019-05-07)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.15.1...v2.15.2)

## Technical Updates / Bugfixes:

- Check for start page before checking local storage [\#1716](https://github.com/nasa-gibs/worldview/pull/1716)

## Merged PRs:

- v2.15.2 [\#1717](https://github.com/nasa-gibs/worldview/pull/1717)

## [v2.15.1](https://github.com/nasa-gibs/worldview/tree/v2.15.1) (2019-05-07)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.15.0...v2.15.1)

## Technical Updates / Bugfixes:

- Worldview embedded in ArcGIS Storymap doesn't work [\#1704](https://github.com/nasa-gibs/worldview/issues/1704)
- Timeline breaks with GIBS custom configuration [\#1641](https://github.com/nasa-gibs/worldview/issues/1641)
- Fix hide tour not working in some cases [\#1715](https://github.com/nasa-gibs/worldview/pull/1715)

## Merged PRs:

- v2.15.1 [\#1714](https://github.com/nasa-gibs/worldview/pull/1714)
- Add checks for localStorage & remove hideTour checkbox if no localStorage [\#1705](https://github.com/nasa-gibs/worldview/pull/1705)

## [v2.15.0](https://github.com/nasa-gibs/worldview/tree/v2.15.0) (2019-04-30)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.14.2...v2.15.0)

## Technical Updates / Bugfixes:

- Manipulating B-layers causes unwanted side-effects while loading tour steps [\#1685](https://github.com/nasa-gibs/worldview/issues/1685)

## Closed Issues:

- Test projects board issue [\#1697](https://github.com/nasa-gibs/worldview/issues/1697)
- Create tour story for April [\#1679](https://github.com/nasa-gibs/worldview/issues/1679)

## Merged PRs:

- v2.15.0 [\#1702](https://github.com/nasa-gibs/worldview/pull/1702)
- Fix tour breaking when using manipulating comparison mode b-state [\#1700](https://github.com/nasa-gibs/worldview/pull/1700)
- Update node-canvas dependency documentation [\#1699](https://github.com/nasa-gibs/worldview/pull/1699)
- Tour story april [\#1698](https://github.com/nasa-gibs/worldview/pull/1698)

## [v2.14.2](https://github.com/nasa-gibs/worldview/tree/v2.14.2) (2019-04-25)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.14.1...v2.14.2)

## Closed Issues:

- Send Feedback on mobile does not bring up email [\#1673](https://github.com/nasa-gibs/worldview/issues/1673)
- Consider adding "Dust and Haze" event type from EONET [\#1572](https://github.com/nasa-gibs/worldview/issues/1572)

## Merged PRs:

- v2.14.2 [\#1695](https://github.com/nasa-gibs/worldview/pull/1695)
- Fix Time ows:Identifier on build and no metadata error [\#1692](https://github.com/nasa-gibs/worldview/pull/1692)

## [v2.14.1](https://github.com/nasa-gibs/worldview/tree/v2.14.1) (2019-03-19)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.14.0...v2.14.1)

## Technical Updates / Bugfixes:

- Add feedback email location when in mobile mode [\#1675](https://github.com/nasa-gibs/worldview/pull/1675)

## Closed Issues:

- Change text style/color that uses backticks in markdown [\#1668](https://github.com/nasa-gibs/worldview/issues/1668)
- Move Planetary Boundary layer above Lower Troposphere in layer order [\#1656](https://github.com/nasa-gibs/worldview/issues/1656)
- Update tour intro text [\#1651](https://github.com/nasa-gibs/worldview/issues/1651)
- Add TRMM Precipitation Rate & Brightness Temperature [\#1648](https://github.com/nasa-gibs/worldview/issues/1648)
- Transition SEDAC layers to GIBS SEDAC layers [\#1644](https://github.com/nasa-gibs/worldview/issues/1644)
- Remove AIRS 400/600 Temperature and Relative Humidity Layers [\#1634](https://github.com/nasa-gibs/worldview/issues/1634)
- Create WV Test Instance with FIRMS [\#1630](https://github.com/nasa-gibs/worldview/issues/1630)

## Merged PRs:

- v2.14.1 [\#1676](https://github.com/nasa-gibs/worldview/pull/1676)

## [v2.14.0](https://github.com/nasa-gibs/worldview/tree/v2.14.0) (2019-03-19)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.14.0-rc.2...v2.14.0)

## Merged PRs:

- v2.14.0 [\#1672](https://github.com/nasa-gibs/worldview/pull/1672)

## [v2.14.0-rc.2](https://github.com/nasa-gibs/worldview/tree/v2.14.0-rc.2) (2019-03-18)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.14.0-rc.1...v2.14.0-rc.2)

## Merged PRs:

- added backticks for more product names and data parameters [\#1670](https://github.com/nasa-gibs/worldview/pull/1670)
- Change code block to grey in layer panel and info panels [\#1669](https://github.com/nasa-gibs/worldview/pull/1669)
- Added backticks to overcome italics issue [\#1667](https://github.com/nasa-gibs/worldview/pull/1667)

## [v2.14.0-rc.1](https://github.com/nasa-gibs/worldview/tree/v2.14.0-rc.1) (2019-03-12)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.13.0...v2.14.0-rc.1)

## Implemented Enhancements:

- Events that cross the dateline cross the entire map, from east to west [\#1568](https://github.com/nasa-gibs/worldview/issues/1568)
- Image download for across the dateline [\#239](https://github.com/nasa-gibs/worldview/issues/239)
- Catalog Of Worldview Examples [\#101](https://github.com/nasa-gibs/worldview/issues/101)

## Technical Updates / Bugfixes:

- Story In-Progress modal is not appearing at the correct size when browser height reduced in IE [\#1636](https://github.com/nasa-gibs/worldview/issues/1636)
- MODIS Granule data download boxes are unselectable on ipad \[dd.sel.6\] [\#1590](https://github.com/nasa-gibs/worldview/issues/1590)
- Lose swath grey outline in arctic or antarctic projections from geographic selected swaths \[dd.polar.13\] [\#869](https://github.com/nasa-gibs/worldview/issues/869)
- Events: permalinks location/date should take precedence over event location/date [\#551](https://github.com/nasa-gibs/worldview/issues/551)
- Test for non-direct links in bulk download does not provide relevant text \[dd.nodirect.3\] [\#539](https://github.com/nasa-gibs/worldview/issues/539)
- dd.curl.6 \(OSX\) [\#537](https://github.com/nasa-gibs/worldview/issues/537)
- Map error. Map should be zoomed in to the maximum over ocean \[perm.in.map.2\] [\#534](https://github.com/nasa-gibs/worldview/issues/534)

## Closed Issues:

- Optimize tour thumbnail image file sizes [\#1646](https://github.com/nasa-gibs/worldview/issues/1646)
- Tour should close when using escape key and clicking outside of modal [\#1642](https://github.com/nasa-gibs/worldview/issues/1642)
- Consider storing/serving WDPA layer as vector tiles [\#1639](https://github.com/nasa-gibs/worldview/issues/1639)
- Unhandled promise rejection error selecting story in mobile [\#1635](https://github.com/nasa-gibs/worldview/issues/1635)
- Update SEDAC Hazard Layer Titles [\#1629](https://github.com/nasa-gibs/worldview/issues/1629)
- Add ICESat-2 & MetOP-C & Sentinel-1A/1B Orbit Tracks [\#1625](https://github.com/nasa-gibs/worldview/issues/1625)
- Add Aerosol Index to Ash Plumes category [\#1624](https://github.com/nasa-gibs/worldview/issues/1624)
- Add SEDAC HBASE and GMIS Layers [\#1594](https://github.com/nasa-gibs/worldview/issues/1594)
- Implement startup tour modal & steps  [\#1354](https://github.com/nasa-gibs/worldview/issues/1354)
- Improve Chrome Audit Scores [\#462](https://github.com/nasa-gibs/worldview/issues/462)

## Merged PRs:

- Update layerorder ompsso2 [\#1658](https://github.com/nasa-gibs/worldview/pull/1658)
- Fix palette export class name [\#1657](https://github.com/nasa-gibs/worldview/pull/1657)
- Added TRMM precipitation and brightness temp layers [\#1655](https://github.com/nasa-gibs/worldview/pull/1655)
- Removed AIRS 400/600 hPa Temp and Rel Humidity [\#1654](https://github.com/nasa-gibs/worldview/pull/1654)
- Transitioned SEDAC WMS layers to GIBS layers [\#1653](https://github.com/nasa-gibs/worldview/pull/1653)
- Changed "the" to "a" [\#1652](https://github.com/nasa-gibs/worldview/pull/1652)

## [v2.13.0](https://github.com/nasa-gibs/worldview/tree/v2.13.0) (2019-02-26)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.13.0-rc.2...v2.13.0)

## Merged PRs:

- v2.13.0 [\#1649](https://github.com/nasa-gibs/worldview/pull/1649)
- Change all tour images to 396x396px and optimize [\#1647](https://github.com/nasa-gibs/worldview/pull/1647)

## [v2.13.0-rc.2](https://github.com/nasa-gibs/worldview/tree/v2.13.0-rc.2) (2019-02-19)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.13.0-rc.1...v2.13.0-rc.2)

## Implemented Enhancements:

- Add lat-long grid labels [\#1617](https://github.com/nasa-gibs/worldview/issues/1617)
- Make layer information and layer settings boxes consistent in font, font size and design [\#1585](https://github.com/nasa-gibs/worldview/issues/1585)
- Better data collection labeling when downloading data [\#1077](https://github.com/nasa-gibs/worldview/issues/1077)
- Create E2E-specific test build [\#1032](https://github.com/nasa-gibs/worldview/issues/1032)
- Run travis in WV docker container  [\#979](https://github.com/nasa-gibs/worldview/issues/979)
- Replace timeline zoom-selector tooltip with WVC component [\#903](https://github.com/nasa-gibs/worldview/issues/903)

## Technical Updates / Bugfixes:

- Error thrown when collapsing layer-list \[tour.state.3\] [\#1602](https://github.com/nasa-gibs/worldview/issues/1602)
- Timeline last date doesn't correspond to date-selector's last date \[date.init.20\] [\#1231](https://github.com/nasa-gibs/worldview/issues/1231)
- Date selection pick on timeline is slightly to the left of selected date [\#951](https://github.com/nasa-gibs/worldview/issues/951)
- Added/checked orbit track is not checked in other relevant measurements section \[layer.add.10\] [\#841](https://github.com/nasa-gibs/worldview/issues/841)
- Dragging animation end date guitar pick past timeline end causes wonky behavior \[date.animation.9\] [\#679](https://github.com/nasa-gibs/worldview/issues/679)

## Closed Issues:

- Imagery missing [\#1621](https://github.com/nasa-gibs/worldview/issues/1621)
- Remove bottom date label click in timeline [\#1557](https://github.com/nasa-gibs/worldview/issues/1557)
- Add blurb advertising video tutorial to Tour [\#1050](https://github.com/nasa-gibs/worldview/issues/1050)
- Cannot open KMZ files in Google Earth if it contains orbit tracks [\#1046](https://github.com/nasa-gibs/worldview/issues/1046)
- Investigate ways to do screenshot e2e tests [\#936](https://github.com/nasa-gibs/worldview/issues/936)
- Data download: Day/night search needs to include both [\#907](https://github.com/nasa-gibs/worldview/issues/907)
- Add US counties and similar admin levels in other countries [\#798](https://github.com/nasa-gibs/worldview/issues/798)
- Timeline zooming with scrollwheel/trackpad is unpleasant [\#775](https://github.com/nasa-gibs/worldview/issues/775)
- Add data download handler for SMAP/Sentinel-1 Soil Moisture [\#636](https://github.com/nasa-gibs/worldview/issues/636)
- Investigate download issue with CERES and CALIPSO layers [\#581](https://github.com/nasa-gibs/worldview/issues/581)
- historical events [\#541](https://github.com/nasa-gibs/worldview/issues/541)
- Add data download handler for Daymet layers [\#169](https://github.com/nasa-gibs/worldview/issues/169)

## Merged PRs:

- Add escape key commands and click outside of modal to close [\#1643](https://github.com/nasa-gibs/worldview/pull/1643)
- Change order of startup stories [\#1640](https://github.com/nasa-gibs/worldview/pull/1640)
- Remove 'Explore Worldview' link when in mobile [\#1638](https://github.com/nasa-gibs/worldview/pull/1638)
- Change in-progress modal max-height to height for IE [\#1637](https://github.com/nasa-gibs/worldview/pull/1637)

## [v2.13.0-rc.1](https://github.com/nasa-gibs/worldview/tree/v2.13.0-rc.1) (2019-02-12)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.12.0...v2.13.0-rc.1)

## Implemented Enhancements:

- normalize range inputs [\#1548](https://github.com/nasa-gibs/worldview/issues/1548)
- Migrate to font-awesome 5.0 [\#1375](https://github.com/nasa-gibs/worldview/issues/1375)
- Preserve application state when permalinking events  [\#1330](https://github.com/nasa-gibs/worldview/issues/1330)
- A|B v2.0 potential feature enhancements [\#1234](https://github.com/nasa-gibs/worldview/issues/1234)
- Add perceptually uniform colormaps for visualization [\#1195](https://github.com/nasa-gibs/worldview/issues/1195)
- Thresholded colorbars should be updated with new min/max [\#1103](https://github.com/nasa-gibs/worldview/issues/1103)
- Add cssnext, a postcss plugin, to the build process [\#923](https://github.com/nasa-gibs/worldview/issues/923)
- Dual legend layers need custom colormaps options [\#375](https://github.com/nasa-gibs/worldview/issues/375)
- Date line should be always visible in mobile [\#220](https://github.com/nasa-gibs/worldview/issues/220)

## Technical Updates / Bugfixes:

- Some measurement descriptions are not using the right description for the assigned measurements [\#1606](https://github.com/nasa-gibs/worldview/issues/1606)
- After moving Sea Ice, Aqua above Sea Ice, Terra in Antarctic projection and changing to Geographic, the AOD layers do not appear \[proj.layer.8\] [\#1581](https://github.com/nasa-gibs/worldview/issues/1581)
- Unable to create GIF \[date.animation.gif.3\] [\#1578](https://github.com/nasa-gibs/worldview/issues/1578)
- Edge specific - can change colors of custom layer thresholds by dragging [\#1573](https://github.com/nasa-gibs/worldview/issues/1573)
- When you remove layers that have been added by an event, and load event again, the layers do not load in the layer list [\#1565](https://github.com/nasa-gibs/worldview/issues/1565)
- UI zooms in when using track pad zoom when hovering event icon [\#1537](https://github.com/nasa-gibs/worldview/issues/1537)
- Date advancement problem in comparison mode [\#1532](https://github.com/nasa-gibs/worldview/issues/1532)
- Failed to execute 'removeChild' on 'Node' in comparison mode [\#1516](https://github.com/nasa-gibs/worldview/issues/1516)
- Cannot call methods on dialog prior to initialization error [\#1515](https://github.com/nasa-gibs/worldview/issues/1515)
- Data bars do not update on projection change [\#1506](https://github.com/nasa-gibs/worldview/issues/1506)
- Second loading notification for Create GIF on multiple clicks [\#1505](https://github.com/nasa-gibs/worldview/issues/1505)
- Unable to open GIFs in Photoshop [\#1263](https://github.com/nasa-gibs/worldview/issues/1263)

## Closed Issues:

- Is this possible? [\#1607](https://github.com/nasa-gibs/worldview/issues/1607)
- Create measurement for the WDPA layer [\#1601](https://github.com/nasa-gibs/worldview/issues/1601)
- Text is easily selectable when using the threshold and opacity sliders [\#1598](https://github.com/nasa-gibs/worldview/issues/1598)
- Issues with swipe and opacity comparison interactions on ipad [\#1592](https://github.com/nasa-gibs/worldview/issues/1592)
- Add AU\_SI12, AU\_SI25 and AU\_SI6 layer descriptions [\#1586](https://github.com/nasa-gibs/worldview/issues/1586)
- Dual legend layers settings - divergent palette option should be next to circle check box [\#1582](https://github.com/nasa-gibs/worldview/issues/1582)
- Opening layer settings may cause data to persist and or crash [\#1577](https://github.com/nasa-gibs/worldview/issues/1577)
- Hover state on timeline's ticks has two separate highlight zones that often arent in sync [\#1575](https://github.com/nasa-gibs/worldview/issues/1575)
- Layers ids in natural events config are old [\#1570](https://github.com/nasa-gibs/worldview/issues/1570)
- Favicon is blurry [\#1569](https://github.com/nasa-gibs/worldview/issues/1569)
- Fix broken E2E tests [\#1564](https://github.com/nasa-gibs/worldview/issues/1564)
- Error adding layers - cannot read property 'title' of undefined [\#1559](https://github.com/nasa-gibs/worldview/issues/1559)
- Plan of action for State system overhaul [\#1553](https://github.com/nasa-gibs/worldview/issues/1553)
- Vector layer ordering is incorrect in image snapshot [\#1546](https://github.com/nasa-gibs/worldview/issues/1546)
- Update README with instructions on installing cairo [\#1538](https://github.com/nasa-gibs/worldview/issues/1538)
- Can't use the upper left corner adjuster in image snapshot [\#1528](https://github.com/nasa-gibs/worldview/issues/1528)
- Add "tracks" to orbit track tags [\#1527](https://github.com/nasa-gibs/worldview/issues/1527)
- Product picker search not showing correct layers [\#1524](https://github.com/nasa-gibs/worldview/issues/1524)
- Layer picker incorrectly showing unavailable layers in polar views [\#1511](https://github.com/nasa-gibs/worldview/issues/1511)
- Prevent mobile comparison mode and data download permalink support [\#1484](https://github.com/nasa-gibs/worldview/issues/1484)
- Download button in GIF creator has unintended border [\#1467](https://github.com/nasa-gibs/worldview/issues/1467)
- Worldview Snapshots Integration [\#1041](https://github.com/nasa-gibs/worldview/issues/1041)
- Investigate better 404 error handling with Vector Tiles [\#733](https://github.com/nasa-gibs/worldview/issues/733)
- Convert all raster icons to svg [\#566](https://github.com/nasa-gibs/worldview/issues/566)

## Merged PRs:

- edited SEDAC titles [\#1632](https://github.com/nasa-gibs/worldview/pull/1632)
- Add orbit tracks 1625 [\#1628](https://github.com/nasa-gibs/worldview/pull/1628)
- Add hbase gmis layers [\#1627](https://github.com/nasa-gibs/worldview/pull/1627)
- Added more measurements to categories [\#1626](https://github.com/nasa-gibs/worldview/pull/1626)
- Allow event tracks to go over date line [\#1620](https://github.com/nasa-gibs/worldview/pull/1620)
- New Feature: Tour Overhaul [\#1618](https://github.com/nasa-gibs/worldview/pull/1618)
- Added measurement for protected areas [\#1604](https://github.com/nasa-gibs/worldview/pull/1604)

## [v2.12.0](https://github.com/nasa-gibs/worldview/tree/v2.12.0) (2019-01-29)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.12.0-rc.2...v2.12.0)

## Merged PRs:

- v2.12.0 [\#1616](https://github.com/nasa-gibs/worldview/pull/1616)
- removed relevant WDPA entries [\#1615](https://github.com/nasa-gibs/worldview/pull/1615)
- Make Favicon Sharper [\#1614](https://github.com/nasa-gibs/worldview/pull/1614)
- Switch sourceMetaData state key to use source description in place of id [\#1611](https://github.com/nasa-gibs/worldview/pull/1611)
- Prevent highlight of text while using slider [\#1599](https://github.com/nasa-gibs/worldview/pull/1599)

## [v2.12.0-rc.2](https://github.com/nasa-gibs/worldview/tree/v2.12.0-rc.2) (2019-01-22)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.12.0-rc.1...v2.12.0-rc.2)

## Technical Updates / Bugfixes:

- Uncaught error when double click layer info/settings followed by remove layer [\#1172](https://github.com/nasa-gibs/worldview/issues/1172)
- Make settings unmount before reloading new settings modal [\#1579](https://github.com/nasa-gibs/worldview/pull/1579)

## Closed Issues:

- Add AMSRU2 Sea ice concentration product download when available in CMR [\#1221](https://github.com/nasa-gibs/worldview/issues/1221)

## Merged PRs:

- Larger slider handles \(Draggers\) [\#1597](https://github.com/nasa-gibs/worldview/pull/1597)
- Remove alerts from tablets [\#1596](https://github.com/nasa-gibs/worldview/pull/1596)
- Always show dateline when using tablets [\#1595](https://github.com/nasa-gibs/worldview/pull/1595)
- Change to moveBefore/pushToBottom instead of replacing layer list [\#1593](https://github.com/nasa-gibs/worldview/pull/1593)
- Add Snapshots support to GIF [\#1589](https://github.com/nasa-gibs/worldview/pull/1589)
- Data download for ASMRU Sea ice concentration layers [\#1588](https://github.com/nasa-gibs/worldview/pull/1588)
- Added sea ice layer descriptions [\#1587](https://github.com/nasa-gibs/worldview/pull/1587)
- Fix yOffset issue for timeline tick hover [\#1584](https://github.com/nasa-gibs/worldview/pull/1584)
- Fix spacing between dual palette selection legend and image [\#1583](https://github.com/nasa-gibs/worldview/pull/1583)
- Selenium updates [\#1580](https://github.com/nasa-gibs/worldview/pull/1580)

## [v2.12.0-rc.1](https://github.com/nasa-gibs/worldview/tree/v2.12.0-rc.1) (2019-01-15)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.11.0...v2.12.0-rc.1)

## Implemented Enhancements:

- Adding CYGNSS, GOSAT-2, METOP-A and B and SAOCOM1-A [\#1522](https://github.com/nasa-gibs/worldview/issues/1522)
- Add cssnext postcss plugin to webpack build [\#1536](https://github.com/nasa-gibs/worldview/pull/1536)

## Technical Updates / Bugfixes:

- Date entry in timeline allows invalid entries [\#927](https://github.com/nasa-gibs/worldview/issues/927)
- Fix image download size adjuster [\#1535](https://github.com/nasa-gibs/worldview/pull/1535)
- Fix projection change bugs [\#1525](https://github.com/nasa-gibs/worldview/pull/1525)

## Closed Issues:

- Can't close the compare notification on develop [\#1562](https://github.com/nasa-gibs/worldview/issues/1562)
- Add spherical view [\#1540](https://github.com/nasa-gibs/worldview/issues/1540)
- Zoom buttons disappear [\#1539](https://github.com/nasa-gibs/worldview/issues/1539)
- Add false color combo layers for fire events [\#1493](https://github.com/nasa-gibs/worldview/issues/1493)
- Change citation text in About [\#1453](https://github.com/nasa-gibs/worldview/issues/1453)
- Add SMAP Freeze/Thaw data download once fix is in place [\#1162](https://github.com/nasa-gibs/worldview/issues/1162)

## Merged PRs:

- Prevent highlighting of custom palettes  [\#1574](https://github.com/nasa-gibs/worldview/pull/1574)
- Normalize range input [\#1571](https://github.com/nasa-gibs/worldview/pull/1571)
- Fix broken E2E tests [\#1567](https://github.com/nasa-gibs/worldview/pull/1567)
- Reapply event-related layers on second selection [\#1566](https://github.com/nasa-gibs/worldview/pull/1566)
- Allow A|B alert to close [\#1563](https://github.com/nasa-gibs/worldview/pull/1563)
- Updates for Selenium in Bamboo [\#1561](https://github.com/nasa-gibs/worldview/pull/1561)
- Update orbit track layer names in measurements [\#1560](https://github.com/nasa-gibs/worldview/pull/1560)
- Add colormaps [\#1558](https://github.com/nasa-gibs/worldview/pull/1558)
- Format GIF addFrame to upload to Twitter [\#1556](https://github.com/nasa-gibs/worldview/pull/1556)
- Add Missing fa icon [\#1555](https://github.com/nasa-gibs/worldview/pull/1555)
- Add WDPA Layer [\#1551](https://github.com/nasa-gibs/worldview/pull/1551)
- Clarify instructions on installing cairo [\#1550](https://github.com/nasa-gibs/worldview/pull/1550)
- Make dateline permanently visible in mobile [\#1549](https://github.com/nasa-gibs/worldview/pull/1549)
- A|B Additions [\#1545](https://github.com/nasa-gibs/worldview/pull/1545)
- Prevent Data Download and Comparison modes from being loaded in mobile [\#1544](https://github.com/nasa-gibs/worldview/pull/1544)
- Worldview Snapshots Integration [\#1543](https://github.com/nasa-gibs/worldview/pull/1543)
- Pinch zoom on event icon zooms browser [\#1542](https://github.com/nasa-gibs/worldview/pull/1542)
- Date advancement problem in comparison mode [\#1533](https://github.com/nasa-gibs/worldview/pull/1533)
- Preserve Application state when permalinking events [\#1531](https://github.com/nasa-gibs/worldview/pull/1531)
- Dual customs [\#1529](https://github.com/nasa-gibs/worldview/pull/1529)
- Add data download e2e tests [\#1521](https://github.com/nasa-gibs/worldview/pull/1521)
- Add condition to check for swipe-line node before performing window resize functions [\#1520](https://github.com/nasa-gibs/worldview/pull/1520)
- Add status flag to prevent multiple GIFs from being creating while one is in progress [\#1519](https://github.com/nasa-gibs/worldview/pull/1519)
- Check for dialog to be initialized prior to closing [\#1518](https://github.com/nasa-gibs/worldview/pull/1518)
- Show/select first valid available layer measurement in product picker [\#1513](https://github.com/nasa-gibs/worldview/pull/1513)
- Fix button Border [\#1509](https://github.com/nasa-gibs/worldview/pull/1509)
- Migrate to Font Awesome v5 [\#1508](https://github.com/nasa-gibs/worldview/pull/1508)

## [v2.11.0](https://github.com/nasa-gibs/worldview/tree/v2.11.0) (2018-12-05)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.10.0-rc.3...v2.11.0)

## Implemented Enhancements:

- Improve UI navigation for product selector [\#1395](https://github.com/nasa-gibs/worldview/issues/1395)
- Add URL parameter for testing notification system [\#1352](https://github.com/nasa-gibs/worldview/issues/1352)
- Add .stylelintignore file [\#1342](https://github.com/nasa-gibs/worldview/issues/1342)
- Bring main configuration into this repository [\#1334](https://github.com/nasa-gibs/worldview/issues/1334)
- Add Degrees Decimal Minutes format [\#1307](https://github.com/nasa-gibs/worldview/issues/1307)
- Date selection: would be helpful to reverse-tab through the fields [\#1293](https://github.com/nasa-gibs/worldview/issues/1293)
- Change animation range by grabbing blue highlight [\#1206](https://github.com/nasa-gibs/worldview/issues/1206)
- Move worldview-components components into core Repo [\#1173](https://github.com/nasa-gibs/worldview/issues/1173)
- Add grayscale palette as another replacement palette option [\#960](https://github.com/nasa-gibs/worldview/issues/960)
- Consider removing burned in info in the "message" notification [\#904](https://github.com/nasa-gibs/worldview/issues/904)
- Optimization of product measurement browsing widget [\#577](https://github.com/nasa-gibs/worldview/issues/577)
- Create static wrap flag [\#229](https://github.com/nasa-gibs/worldview/issues/229)
- Sort Satellite/Sensor list in Categories view by list order in measurements json files or alphabetically [\#85](https://github.com/nasa-gibs/worldview/issues/85)

## Technical Updates / Bugfixes:

- Unable to create a gif after clicking on certain events [\#1503](https://github.com/nasa-gibs/worldview/issues/1503)
- mouseOut event for coordinates allowing undefined relatedTarget [\#1471](https://github.com/nasa-gibs/worldview/issues/1471)
- Dragging map in comparison spy mode moves mouse cursor outside of spy glass [\#1464](https://github.com/nasa-gibs/worldview/issues/1464)
- Edge/IE11 - able to drag screen too far to the right while in comparison mode \[compare.swipe.2\] [\#1463](https://github.com/nasa-gibs/worldview/issues/1463)
- Sidebar padding changes when removing layers \(IE11\) [\#1459](https://github.com/nasa-gibs/worldview/issues/1459)
- Layer picker checkboxes are sometimes very slow or unresponsive \(IE11\) [\#1458](https://github.com/nasa-gibs/worldview/issues/1458)
- Product picker categories have no background images in Edge [\#1456](https://github.com/nasa-gibs/worldview/issues/1456)
- Create image extent initially undefined and coordinates sticky to mouse movement [\#1449](https://github.com/nasa-gibs/worldview/issues/1449)
- Guitar pick in timeline goes an extra step after the current day when using the forward arrow [\#1443](https://github.com/nasa-gibs/worldview/issues/1443)
- Page crashes on load and shows An unexpected error has occurred [\#1415](https://github.com/nasa-gibs/worldview/issues/1415)
- Newly added base layers can appear at bottom of stack [\#1412](https://github.com/nasa-gibs/worldview/issues/1412)
- Comparison mode doesn't exit under certain circumstances [\#1411](https://github.com/nasa-gibs/worldview/issues/1411)
- HTML entities should resolve in EONET listings [\#1399](https://github.com/nasa-gibs/worldview/issues/1399)
- Squash Palette at Max Thresholds [\#1390](https://github.com/nasa-gibs/worldview/issues/1390)
- util.browser.touchDevice causes unwanted side-effects on touchscreen laptops & 2-in-1's [\#1389](https://github.com/nasa-gibs/worldview/issues/1389)
- Hovering over Coordinate arrows hides coordinate widget [\#1374](https://github.com/nasa-gibs/worldview/issues/1374)
- Multi-day events with a lot of dates cause slow track generation [\#1346](https://github.com/nasa-gibs/worldview/issues/1346)
- `showSubdaily` parameter no longer working in AB branch [\#1344](https://github.com/nasa-gibs/worldview/issues/1344)
- IE11/Edge missing scroll bar in layer list [\#1316](https://github.com/nasa-gibs/worldview/issues/1316)
- Double tapping in iOS causes Safari to zoom in and you lose view of layer list and timeline [\#1235](https://github.com/nasa-gibs/worldview/issues/1235)
- Remove "Events may not be visible at all times" notice when not in events mode [\#1224](https://github.com/nasa-gibs/worldview/issues/1224)
- Guitar pick skips months \(and changes days\) when changing from December 30 or 31 to the next year [\#1205](https://github.com/nasa-gibs/worldview/issues/1205)
- IE11 event marker hover TypeError [\#1155](https://github.com/nasa-gibs/worldview/issues/1155)
- Notification spacing is off [\#1149](https://github.com/nasa-gibs/worldview/issues/1149)
- Selected data in download links has empty link \[dd.single.12\] [\#871](https://github.com/nasa-gibs/worldview/issues/871)
- Image download windows shrinks to 0x0px after moving the map [\#852](https://github.com/nasa-gibs/worldview/issues/852)
- Coordinates should be disabled for tablets/ipad [\#708](https://github.com/nasa-gibs/worldview/issues/708)
- Only one granule removed when corresponding layer is remove \[dd.sel.19 & dd.sel.21\] [\#686](https://github.com/nasa-gibs/worldview/issues/686)

## Closed Issues:

- Check new orbit tracks to see if they should wrap adjacent days [\#1526](https://github.com/nasa-gibs/worldview/issues/1526)
- Remove GA code [\#1499](https://github.com/nasa-gibs/worldview/issues/1499)
- Timeline data bars are not updated when layer order changes \[layer.active.13\] [\#1498](https://github.com/nasa-gibs/worldview/issues/1498)
- Timeline data bars not updating color when layer visibility is toggled \[date.data.5\] [\#1497](https://github.com/nasa-gibs/worldview/issues/1497)
- Timeline forward right arrow missing \[date.init.20\] [\#1494](https://github.com/nasa-gibs/worldview/issues/1494)
- Number of layers doesn't update on Projection change \(Mobile\) \[proj.nav.5\] [\#1488](https://github.com/nasa-gibs/worldview/issues/1488)
- Remove inactive tag from OMI UV layers [\#1486](https://github.com/nasa-gibs/worldview/issues/1486)
- Search mobile version input is too tight [\#1480](https://github.com/nasa-gibs/worldview/issues/1480)
- No back button in polar layer selection list [\#1469](https://github.com/nasa-gibs/worldview/issues/1469)
- Remove AMSRU2 SWE layers [\#1465](https://github.com/nasa-gibs/worldview/issues/1465)
- Data download MODIS grid H/V numbers are not displayed at zoomed out resolutions \[dd.modis.grid.1\] [\#1462](https://github.com/nasa-gibs/worldview/issues/1462)
- Timeline date picker squishing/alignment change [\#1450](https://github.com/nasa-gibs/worldview/issues/1450)
- Measurement titles are blurrier/not as sharp [\#1442](https://github.com/nasa-gibs/worldview/issues/1442)
- The H3 titles in the measurements descriptions are not as bold as before [\#1441](https://github.com/nasa-gibs/worldview/issues/1441)
- Product picker should maintain search terms [\#1440](https://github.com/nasa-gibs/worldview/issues/1440)
- Layers extend beyond edge of layer list when adding from product picker [\#1439](https://github.com/nasa-gibs/worldview/issues/1439)
- Bottom border on `Exit Comparison` Button [\#1434](https://github.com/nasa-gibs/worldview/issues/1434)
- Adding GCOM-C orbit-track [\#1432](https://github.com/nasa-gibs/worldview/issues/1432)
- Adding ISS/LIS Flash Radiance and Count [\#1431](https://github.com/nasa-gibs/worldview/issues/1431)
- Change OSCAR start date [\#1427](https://github.com/nasa-gibs/worldview/issues/1427)
- Add OMI UV Aerosol Index Layer [\#1421](https://github.com/nasa-gibs/worldview/issues/1421)
- Add CYGNSS Wind Speed Daily [\#1420](https://github.com/nasa-gibs/worldview/issues/1420)
- When in AEST, timeline date differs from the left entry and the guitar pick [\#1410](https://github.com/nasa-gibs/worldview/issues/1410)
- Create tests for alternate time zone [\#1403](https://github.com/nasa-gibs/worldview/issues/1403)
- DOY label is incorrect when you pass the GMT time zone [\#1401](https://github.com/nasa-gibs/worldview/issues/1401)
- Auto timeline expansion for “future-capable” layers  [\#1387](https://github.com/nasa-gibs/worldview/issues/1387)
- Update About text in About section [\#1385](https://github.com/nasa-gibs/worldview/issues/1385)
- Add DNB to Severe Storms category [\#1384](https://github.com/nasa-gibs/worldview/issues/1384)
- Ignore stylelint rules in all web folders other than /css [\#1381](https://github.com/nasa-gibs/worldview/issues/1381)
- Deprecate worldview-options-eosdis [\#1371](https://github.com/nasa-gibs/worldview/issues/1371)
- Adding AMSRU STD Snow Water Equivalent [\#1369](https://github.com/nasa-gibs/worldview/issues/1369)
- Add A|B URL parameters to docs [\#1361](https://github.com/nasa-gibs/worldview/issues/1361)
- Update WV image on GitHub Readme [\#1358](https://github.com/nasa-gibs/worldview/issues/1358)
- Make IE11 minimum requirement [\#1335](https://github.com/nasa-gibs/worldview/issues/1335)
- Add podaac tag to PODAAC layers [\#1320](https://github.com/nasa-gibs/worldview/issues/1320)
- Rows with long satellite/sensor text in Categories are not highlighted all the way across [\#1312](https://github.com/nasa-gibs/worldview/issues/1312)
- Change DMSP-F8 to DMSP-F08 [\#1311](https://github.com/nasa-gibs/worldview/issues/1311)
- Update CR layer description text to remove Rapid Response [\#1290](https://github.com/nasa-gibs/worldview/issues/1290)
- Migrate Buster Tests to Jest [\#980](https://github.com/nasa-gibs/worldview/issues/980)
- Add VIIRS Vector Fires as an option in data download [\#915](https://github.com/nasa-gibs/worldview/issues/915)
- Links in the About section should open in a new tab/window [\#889](https://github.com/nasa-gibs/worldview/issues/889)
- Improve metrics tagging [\#831](https://github.com/nasa-gibs/worldview/issues/831)
- Rename variable name `id` from build script [\#820](https://github.com/nasa-gibs/worldview/issues/820)
- Update OpenLayers to latest version [\#701](https://github.com/nasa-gibs/worldview/issues/701)
- Update unit testing framework [\#96](https://github.com/nasa-gibs/worldview/issues/96)

## Merged PRs:

- v2.11.0 [\#1534](https://github.com/nasa-gibs/worldview/pull/1534)
- Added IMERG descriptions [\#1530](https://github.com/nasa-gibs/worldview/pull/1530)
- Add orbit tracks [\#1523](https://github.com/nasa-gibs/worldview/pull/1523)
- added data download for SMAP Freeze/Thaw [\#1514](https://github.com/nasa-gibs/worldview/pull/1514)
- fixed citation and event layers [\#1512](https://github.com/nasa-gibs/worldview/pull/1512)

## [v2.10.0-rc.3](https://github.com/nasa-gibs/worldview/tree/v2.10.0-rc.3) (2018-11-15)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.10.0...v2.10.0-rc.3)

## [v2.10.0](https://github.com/nasa-gibs/worldview/tree/v2.10.0) (2018-11-15)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.10.0-rc.2...v2.10.0)

## Technical Updates / Bugfixes:

- URL Fails to load in IE11 \(react infinite loop\) \[date.pick.7\] [\#1457](https://github.com/nasa-gibs/worldview/issues/1457)

## Closed Issues:

- Layer list is sometimes incorrect when switching to the polar projection [\#1468](https://github.com/nasa-gibs/worldview/issues/1468)
- Data download shows granules that are not available for download [\#898](https://github.com/nasa-gibs/worldview/issues/898)

## Merged PRs:

- Remove date key for static layers [\#1504](https://github.com/nasa-gibs/worldview/pull/1504)
- Fix timeline data bar colors not updating [\#1502](https://github.com/nasa-gibs/worldview/pull/1502)
- Fix timeline forward arrow missing [\#1501](https://github.com/nasa-gibs/worldview/pull/1501)
- Remove GA code for GTM upgrade [\#1500](https://github.com/nasa-gibs/worldview/pull/1500)
- Fix layer count in sidebar [\#1492](https://github.com/nasa-gibs/worldview/pull/1492)

## [v2.10.0-rc.2](https://github.com/nasa-gibs/worldview/tree/v2.10.0-rc.2) (2018-11-08)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.10.0-rc.1...v2.10.0-rc.2)

## Technical Updates / Bugfixes:

- Adding layers causes sidebar to expand and cutoff [\#1451](https://github.com/nasa-gibs/worldview/issues/1451)
- Use ol drag listener to update spy [\#1482](https://github.com/nasa-gibs/worldview/pull/1482)
- Remove breadcrumb in smaller windows  [\#1481](https://github.com/nasa-gibs/worldview/pull/1481)
- Fix additional stylelint errors [\#1476](https://github.com/nasa-gibs/worldview/pull/1476)
- Add stylelint to tests and fix css lint errors [\#1448](https://github.com/nasa-gibs/worldview/pull/1448)
- Retain search terms when modal closes then opens [\#1446](https://github.com/nasa-gibs/worldview/pull/1446)

## Closed Issues:

- Layer picker category background images not being set [\#1460](https://github.com/nasa-gibs/worldview/issues/1460)
- Data Download for remote instance and for non-CMR data [\#1416](https://github.com/nasa-gibs/worldview/issues/1416)
- Support more zoom levels / time intervals for sub-daily products [\#610](https://github.com/nasa-gibs/worldview/issues/610)

## Merged PRs:

- Add animation margin and fix spy bug [\#1491](https://github.com/nasa-gibs/worldview/pull/1491)
- apply preventDefault [\#1490](https://github.com/nasa-gibs/worldview/pull/1490)
- Fix IE11 scrollbars [\#1489](https://github.com/nasa-gibs/worldview/pull/1489)
- Removed inactive tag and updated end date [\#1487](https://github.com/nasa-gibs/worldview/pull/1487)
- Override body position to static [\#1485](https://github.com/nasa-gibs/worldview/pull/1485)
- Make layer add/remove faster [\#1483](https://github.com/nasa-gibs/worldview/pull/1483)
- Rename exceedLength to overflow [\#1479](https://github.com/nasa-gibs/worldview/pull/1479)
- Fix sub-daily check [\#1478](https://github.com/nasa-gibs/worldview/pull/1478)
- Redo sort measurement source order [\#1477](https://github.com/nasa-gibs/worldview/pull/1477)
- Make category background images work in Edge [\#1475](https://github.com/nasa-gibs/worldview/pull/1475)
- Add autoFocus when not using a touch device [\#1474](https://github.com/nasa-gibs/worldview/pull/1474)
- Search back button in polar views [\#1473](https://github.com/nasa-gibs/worldview/pull/1473)
- add to conditonal for mouseOut to prevent undefined [\#1472](https://github.com/nasa-gibs/worldview/pull/1472)
- Removed new AMSRU2 SWE layers [\#1470](https://github.com/nasa-gibs/worldview/pull/1470)
- Remove layer-list resizing when add layer modal is open [\#1461](https://github.com/nasa-gibs/worldview/pull/1461)
- Added ISS LIS Layers [\#1452](https://github.com/nasa-gibs/worldview/pull/1452)
- Fix date input not respecting max date  [\#1447](https://github.com/nasa-gibs/worldview/pull/1447)
- Product Picker Font Fixes [\#1445](https://github.com/nasa-gibs/worldview/pull/1445)

## [v2.10.0-rc.1](https://github.com/nasa-gibs/worldview/tree/v2.10.0-rc.1) (2018-10-30)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.9.1...v2.10.0-rc.1)

## Implemented Enhancements:

- JPEG Baselayer with Colorbar [\#1380](https://github.com/nasa-gibs/worldview/issues/1380)
- Improve cache policy on static assets [\#1127](https://github.com/nasa-gibs/worldview/issues/1127)
- Push OMI SO2 updated imagery [\#492](https://github.com/nasa-gibs/worldview/issues/492)

## Technical Updates / Bugfixes:

- Comparison: Not loading correct imagery on one side [\#1363](https://github.com/nasa-gibs/worldview/issues/1363)
- Fix custom palettes in compare mode [\#1422](https://github.com/nasa-gibs/worldview/pull/1422)
- Fix palettes while keeping event track performance \#1346 \[!mportant\] [\#1418](https://github.com/nasa-gibs/worldview/pull/1418)
- Fix when newly added base layers can appear at bottom of stack \#1412 [\#1417](https://github.com/nasa-gibs/worldview/pull/1417)
- Rename id to ident [\#1310](https://github.com/nasa-gibs/worldview/pull/1310)

## Closed Issues:

- Really close palette entries not preserved [\#1428](https://github.com/nasa-gibs/worldview/issues/1428)
- transparent tiles "zoomed in" views... [\#1407](https://github.com/nasa-gibs/worldview/issues/1407)
- "TypeError: \_jquery2.default.get\(...\).success is not a function" [\#1386](https://github.com/nasa-gibs/worldview/issues/1386)
- Move WV from old php WMS to new WMS [\#1370](https://github.com/nasa-gibs/worldview/issues/1370)
- AMSRU Sea Ice version change [\#1366](https://github.com/nasa-gibs/worldview/issues/1366)

## Merged PRs:

- Add moment.js as devDependency for builds [\#1438](https://github.com/nasa-gibs/worldview/pull/1438)
- Fix guitar pick offset in alternate timezones [\#1437](https://github.com/nasa-gibs/worldview/pull/1437)
- Improve product picker 577 [\#1436](https://github.com/nasa-gibs/worldview/pull/1436)
- Added GCOM-C orbit tracks [\#1435](https://github.com/nasa-gibs/worldview/pull/1435)
- Remove dates from console when animation is playing [\#1433](https://github.com/nasa-gibs/worldview/pull/1433)
- changed start date for OSCAR layers [\#1430](https://github.com/nasa-gibs/worldview/pull/1430)
- Fix infinite loop issue on certain devices [\#1429](https://github.com/nasa-gibs/worldview/pull/1429)
- Don't show coords until mouse is detected [\#1426](https://github.com/nasa-gibs/worldview/pull/1426)
- Added CYGNSS Wind Speed layer [\#1425](https://github.com/nasa-gibs/worldview/pull/1425)
- Added OMI UV Aerosol Index layer [\#1424](https://github.com/nasa-gibs/worldview/pull/1424)
- added AMSRU2 SWE layers [\#1423](https://github.com/nasa-gibs/worldview/pull/1423)
- Replace touch device checks [\#1419](https://github.com/nasa-gibs/worldview/pull/1419)
- Update layer numbers [\#1414](https://github.com/nasa-gibs/worldview/pull/1414)
- Remove README caret [\#1413](https://github.com/nasa-gibs/worldview/pull/1413)
- Highlight full width of long names in product picker [\#1409](https://github.com/nasa-gibs/worldview/pull/1409)
- Make IE11 minimum site requirement [\#1408](https://github.com/nasa-gibs/worldview/pull/1408)
- Run unit tests in another timezone [\#1406](https://github.com/nasa-gibs/worldview/pull/1406)
- Fix Day of year label in timeline [\#1402](https://github.com/nasa-gibs/worldview/pull/1402)
- Set html for sidebar event titles [\#1400](https://github.com/nasa-gibs/worldview/pull/1400)
- Optimize rendering of event tracks [\#1398](https://github.com/nasa-gibs/worldview/pull/1398)
- Add new A|B url Parameters to Docs [\#1397](https://github.com/nasa-gibs/worldview/pull/1397)
- Only update checkbox if custom palette is in effect [\#1393](https://github.com/nasa-gibs/worldview/pull/1393)
- Updates to text and added night layers to storm and fire categories [\#1392](https://github.com/nasa-gibs/worldview/pull/1392)
- Add layer parameters to utilize future layer timeline support [\#1391](https://github.com/nasa-gibs/worldview/pull/1391)
- Check for button on mouseout, remove throttle [\#1383](https://github.com/nasa-gibs/worldview/pull/1383)
- Ignore stylelinting web folders other than /css [\#1382](https://github.com/nasa-gibs/worldview/pull/1382)
- Fix toolbar spacing [\#1379](https://github.com/nasa-gibs/worldview/pull/1379)
- Added PO.DAAC tag to PO.DAAC layers [\#1378](https://github.com/nasa-gibs/worldview/pull/1378)
- Changed DMSP-F8 to DMSP-F08 [\#1377](https://github.com/nasa-gibs/worldview/pull/1377)
- Improve site metrics [\#1376](https://github.com/nasa-gibs/worldview/pull/1376)
- Update messages notifications [\#1373](https://github.com/nasa-gibs/worldview/pull/1373)
- Update dependencies [\#1368](https://github.com/nasa-gibs/worldview/pull/1368)
- Bring main configuration into this repository [\#1367](https://github.com/nasa-gibs/worldview/pull/1367)
- Add libcario to docker build [\#1365](https://github.com/nasa-gibs/worldview/pull/1365)
- Fix date rendering between A & B states [\#1364](https://github.com/nasa-gibs/worldview/pull/1364)
- Add new readme image [\#1360](https://github.com/nasa-gibs/worldview/pull/1360)
- Add Degrees Decimal Minutes format [\#1357](https://github.com/nasa-gibs/worldview/pull/1357)
- change nightwatch process module path from bin to module [\#1356](https://github.com/nasa-gibs/worldview/pull/1356)
- Add notificationURL testing parameter and documentation [\#1353](https://github.com/nasa-gibs/worldview/pull/1353)
- Fix sub-daily permalink flag \#1344 [\#1347](https://github.com/nasa-gibs/worldview/pull/1347)
- Add .stylelintignore [\#1343](https://github.com/nasa-gibs/worldview/pull/1343)
- Check that granule to remove has been selected [\#1321](https://github.com/nasa-gibs/worldview/pull/1321)
- Remove 'Events may not be visible at all times' notice when not in events mode [\#1319](https://github.com/nasa-gibs/worldview/pull/1319)
- Add vendor prefix IE11/Edge scrollbar fix for cut off layer list text [\#1318](https://github.com/nasa-gibs/worldview/pull/1318)
- Only hoist links when more than one granule is present [\#1317](https://github.com/nasa-gibs/worldview/pull/1317)
- Sort satellite/sensor list in categories view [\#1309](https://github.com/nasa-gibs/worldview/pull/1309)
- Add reverse tab \(shift tab\) functionality to date selector input [\#1308](https://github.com/nasa-gibs/worldview/pull/1308)
- Links in about section open in a new tab/window [\#1306](https://github.com/nasa-gibs/worldview/pull/1306)
- Add "wrapX" configuration parameter [\#1303](https://github.com/nasa-gibs/worldview/pull/1303)
- Change getCapabilities script to use urllib3 [\#1302](https://github.com/nasa-gibs/worldview/pull/1302)
- Selenium testing in docker container [\#1296](https://github.com/nasa-gibs/worldview/pull/1296)
- Remove additional timezone offset compensation for year zoom timeline [\#1294](https://github.com/nasa-gibs/worldview/pull/1294)
- Event marker hover IE11 CustomEvent fix [\#1289](https://github.com/nasa-gibs/worldview/pull/1289)
- Webpack build enhancements - Part 1 [\#1275](https://github.com/nasa-gibs/worldview/pull/1275)
- OpenLayers 5.2.0 upgrade [\#1262](https://github.com/nasa-gibs/worldview/pull/1262)
- Add drag feature for timeline GIF animation dragger range [\#1254](https://github.com/nasa-gibs/worldview/pull/1254)
- Convert unit tests to use Jest [\#1241](https://github.com/nasa-gibs/worldview/pull/1241)
- Add natural event E2E tests [\#1236](https://github.com/nasa-gibs/worldview/pull/1236)
- Add english lang support to HTML document [\#1230](https://github.com/nasa-gibs/worldview/pull/1230)

## [v2.9.1](https://github.com/nasa-gibs/worldview/tree/v2.9.1) (2018-09-27)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.9.0...v2.9.1)

## Implemented Enhancements:

- Consolidate Util functions [\#1034](https://github.com/nasa-gibs/worldview/issues/1034)
- Replace Timeline date selector with WVC reusable component [\#902](https://github.com/nasa-gibs/worldview/issues/902)
- Center Text in Dateline tooltip [\#830](https://github.com/nasa-gibs/worldview/issues/830)

## Technical Updates / Bugfixes:

- On startup, v2.9.0 may try to load old code [\#1362](https://github.com/nasa-gibs/worldview/issues/1362)
- "Base Layers" should be two words [\#1348](https://github.com/nasa-gibs/worldview/issues/1348)
- Layer list not expanding in mobile \[layer.mob.init.1\] [\#1332](https://github.com/nasa-gibs/worldview/issues/1332)
- The timeline's "YYYY-MMM-DD" and "\(DDD\)" labels aren't always synchronized in comparison mode [\#1328](https://github.com/nasa-gibs/worldview/issues/1328)
- Time selector is "repelled" by edge of timeline in comparison mode [\#1327](https://github.com/nasa-gibs/worldview/issues/1327)
- \[proj.layer.8\] When moving Sea Ice, Aqua above Sea Ice, Terra in Antarctic proj, it only moves up one position when you switch to Geographic [\#1326](https://github.com/nasa-gibs/worldview/issues/1326)
- Hovering over the circle with slash icon should show a tooltip that says what dates the imagery are available [\#1324](https://github.com/nasa-gibs/worldview/issues/1324)
- When dragging A or B dragger beyond the end of the timeline, the app stops working properly [\#1286](https://github.com/nasa-gibs/worldview/issues/1286)
- If you move "A" dragger on the timeline, sometimes you can see the guitar pick off set behind it [\#1283](https://github.com/nasa-gibs/worldview/issues/1283)
- Hovering over discrete palette value sometimes highlights wrong color [\#1282](https://github.com/nasa-gibs/worldview/issues/1282)
- Missing white border around focused date-selection input [\#1270](https://github.com/nasa-gibs/worldview/issues/1270)
- Button borders are grey 1px [\#1269](https://github.com/nasa-gibs/worldview/issues/1269)
- Title Worldview and NASA meatball look fuzzy [\#1268](https://github.com/nasa-gibs/worldview/issues/1268)
- \[settings.nav.7\] Layer Settings window does not close when you change to the Events tab [\#1267](https://github.com/nasa-gibs/worldview/issues/1267)
- Image download selection box coordinates slightly offset [\#1265](https://github.com/nasa-gibs/worldview/issues/1265)
- \[date.input.1\] Clicking on date field no longer selects whole field [\#1261](https://github.com/nasa-gibs/worldview/issues/1261)
- Data download links are not removed when trying to remove from dialog [\#1257](https://github.com/nasa-gibs/worldview/issues/1257)
- Draggable boundaries of layers in sidebar have changed [\#1256](https://github.com/nasa-gibs/worldview/issues/1256)
- \[proj.layer.1\] Moving layer in Arctic/Antarctic causes geographic to lose layers that only load in geographic [\#1252](https://github.com/nasa-gibs/worldview/issues/1252)
- Starting tour from compare mode breaks app [\#1247](https://github.com/nasa-gibs/worldview/issues/1247)
- Starting tour is slow [\#1237](https://github.com/nasa-gibs/worldview/issues/1237)
- A|B: Rename "Products" to "Layers" [\#1170](https://github.com/nasa-gibs/worldview/issues/1170)
- Can not set Opacity of Graticule [\#1156](https://github.com/nasa-gibs/worldview/issues/1156)
- Long legend descriptions format incorrectly [\#1098](https://github.com/nasa-gibs/worldview/issues/1098)

## Closed Issues:

- Add node-canvas installation documentation for Windows users [\#1359](https://github.com/nasa-gibs/worldview/issues/1359)
- Keep 'Add Layers' button color consistent [\#1345](https://github.com/nasa-gibs/worldview/issues/1345)
- guitar pick in wrong place after timeline view shift [\#1336](https://github.com/nasa-gibs/worldview/issues/1336)
- Events not selectable on error condition [\#1333](https://github.com/nasa-gibs/worldview/issues/1333)
- Sidebar styling missing borders [\#1329](https://github.com/nasa-gibs/worldview/issues/1329)
- Add OMPS AI layer descriptions [\#1305](https://github.com/nasa-gibs/worldview/issues/1305)
- A|B Swipe mode drag icons are inconsistent [\#1284](https://github.com/nasa-gibs/worldview/issues/1284)
- Hover effect on image download button should be removed when disabled. [\#1281](https://github.com/nasa-gibs/worldview/issues/1281)
- Sidebar tabs Layers, Events, Data hover styling different [\#1278](https://github.com/nasa-gibs/worldview/issues/1278)
- Map shifts when clicking on image download [\#1277](https://github.com/nasa-gibs/worldview/issues/1277)
- Button fade animation on wrong button [\#1276](https://github.com/nasa-gibs/worldview/issues/1276)
- Additional whitespace added above colorbar. [\#1266](https://github.com/nasa-gibs/worldview/issues/1266)
- Increase spacing between dates in timeline [\#1259](https://github.com/nasa-gibs/worldview/issues/1259)
- \[tour.state.1\] Switching from Arctic to Geographic with Tour breaks app [\#1251](https://github.com/nasa-gibs/worldview/issues/1251)
- Update image of the layer picker in the tour [\#1250](https://github.com/nasa-gibs/worldview/issues/1250)
- Datelines are incorrect in comparison mode [\#1246](https://github.com/nasa-gibs/worldview/issues/1246)
- Text in collapsed layer list needs a space [\#1244](https://github.com/nasa-gibs/worldview/issues/1244)
- Deprecate worldview-components repository [\#1238](https://github.com/nasa-gibs/worldview/issues/1238)
- A|B -- Beta testing bug list [\#1182](https://github.com/nasa-gibs/worldview/issues/1182)
- A|B: E2E tests [\#1119](https://github.com/nasa-gibs/worldview/issues/1119)
- A|B: Polish  [\#1118](https://github.com/nasa-gibs/worldview/issues/1118)
- A-B: UAT Testing [\#998](https://github.com/nasa-gibs/worldview/issues/998)
- A-B: Beta Testing [\#996](https://github.com/nasa-gibs/worldview/issues/996)
- A-B: Spy comparison [\#995](https://github.com/nasa-gibs/worldview/issues/995)
- A-B: Opacity slider integration [\#994](https://github.com/nasa-gibs/worldview/issues/994)
- A-B: Map slider integration [\#993](https://github.com/nasa-gibs/worldview/issues/993)
- A-B: Opacity slider widget [\#992](https://github.com/nasa-gibs/worldview/issues/992)
- A-B: Map slider widget [\#991](https://github.com/nasa-gibs/worldview/issues/991)
- A-B: Second guitar pick [\#990](https://github.com/nasa-gibs/worldview/issues/990)
- A-B: Layer picker updates [\#989](https://github.com/nasa-gibs/worldview/issues/989)
- A-B: Map layer management [\#988](https://github.com/nasa-gibs/worldview/issues/988)
- A-B: Permalink support [\#987](https://github.com/nasa-gibs/worldview/issues/987)
- A-B: Model Updates [\#986](https://github.com/nasa-gibs/worldview/issues/986)
- A-B selector [\#985](https://github.com/nasa-gibs/worldview/issues/985)
- Replacement solution for scroll bar [\#558](https://github.com/nasa-gibs/worldview/issues/558)

## [v2.9.0](https://github.com/nasa-gibs/worldview/tree/v2.9.0) (2018-09-25)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.9.0-rc.5...v2.9.0)

## Closed Issues:

- A-B: SIT Testing [\#997](https://github.com/nasa-gibs/worldview/issues/997)

## Merged PRs:

- v2.9.0 [\#1355](https://github.com/nasa-gibs/worldview/pull/1355)

## [v2.9.0-rc.5](https://github.com/nasa-gibs/worldview/tree/v2.9.0-rc.5) (2018-09-24)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.9.0-rc.4...v2.9.0-rc.5)

## Implemented Enhancements:

- Design tour with reduced steps & dialogue [\#102](https://github.com/nasa-gibs/worldview/issues/102)

## Merged PRs:

-  Add space between Base and Layers \#1348 [\#1350](https://github.com/nasa-gibs/worldview/pull/1350)
- Keep layer add button red [\#1349](https://github.com/nasa-gibs/worldview/pull/1349)

## [v2.9.0-rc.4](https://github.com/nasa-gibs/worldview/tree/v2.9.0-rc.4) (2018-09-20)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.9.0-rc.3...v2.9.0-rc.4)

## Technical Updates / Bugfixes:

- IE11 Add Layers button jumps - can't reliably reproduce [\#1228](https://github.com/nasa-gibs/worldview/issues/1228)

## Merged PRs:

- Update compare E2E tests to work with  UAT/SIT bug fixes [\#1341](https://github.com/nasa-gibs/worldview/pull/1341)
- Sidebar Styling bug fixes [\#1340](https://github.com/nasa-gibs/worldview/pull/1340)
- Allow event tab to be clicked even when EONET isn't responding [\#1339](https://github.com/nasa-gibs/worldview/pull/1339)
- Mobile expand fix [\#1338](https://github.com/nasa-gibs/worldview/pull/1338)
- Fix polar drag and dropping [\#1337](https://github.com/nasa-gibs/worldview/pull/1337)
- Make A|B draggers work the same as guitar pick [\#1331](https://github.com/nasa-gibs/worldview/pull/1331)
- Remove dangling apache config link [\#1325](https://github.com/nasa-gibs/worldview/pull/1325)

## [v2.9.0-rc.3](https://github.com/nasa-gibs/worldview/tree/v2.9.0-rc.3) (2018-09-18)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.9.0-rc.1...v2.9.0-rc.3)

## Technical Updates / Bugfixes:

- IE11 AB dragger off map makes dragger sticky to mouse movement [\#1304](https://github.com/nasa-gibs/worldview/issues/1304)
- Timeline in year zoom level is one year off for Jan 01 and date change causes year jump [\#1258](https://github.com/nasa-gibs/worldview/issues/1258)
- Running data bug when page is loaded in Arctic projection [\#1017](https://github.com/nasa-gibs/worldview/issues/1017)
- Mobile click not working as expected in layers list \[Android S6 - Chrome\] [\#878](https://github.com/nasa-gibs/worldview/issues/878)
- Date stamps don't show on first creation/download of Animated GIF \[date.animation.gif.3\] [\#839](https://github.com/nasa-gibs/worldview/issues/839)
- Fix A|B draggers touch-event bug [\#1298](https://github.com/nasa-gibs/worldview/pull/1298)
- Remove dateline dates when in AB  [\#1288](https://github.com/nasa-gibs/worldview/pull/1288)

## Closed Issues:

- Inactive tabs have white border and no background on hover [\#1279](https://github.com/nasa-gibs/worldview/issues/1279)
- When you take the tour, the date changes back to today [\#1245](https://github.com/nasa-gibs/worldview/issues/1245)
- Investigate feasibility of toggling "invisible" data flags [\#1187](https://github.com/nasa-gibs/worldview/issues/1187)
- Pixel count for 500m in image download not same as expected in test plan \[id.nav.5\] [\#893](https://github.com/nasa-gibs/worldview/issues/893)

## Merged PRs:

- Fix Image download coordinate offset [\#1322](https://github.com/nasa-gibs/worldview/pull/1322)
- Only trigger hasData event if events is active \#1314 [\#1315](https://github.com/nasa-gibs/worldview/pull/1315)
- Remove guitar pick when in A|B [\#1313](https://github.com/nasa-gibs/worldview/pull/1313)
- Make Tab hover border not overlap blue area  [\#1301](https://github.com/nasa-gibs/worldview/pull/1301)
- Fix fuzzy logo  [\#1300](https://github.com/nasa-gibs/worldview/pull/1300)
- Update tour image  [\#1299](https://github.com/nasa-gibs/worldview/pull/1299)
- Fix discrete palettes with multiple rows [\#1297](https://github.com/nasa-gibs/worldview/pull/1297)
- Fix compare styling  [\#1295](https://github.com/nasa-gibs/worldview/pull/1295)
- Fix map shift when clicking on image download [\#1291](https://github.com/nasa-gibs/worldview/pull/1291)
- Button styling 1276 1281 [\#1287](https://github.com/nasa-gibs/worldview/pull/1287)
- Constrain drag-drop to within parent layer-group \#1256 [\#1285](https://github.com/nasa-gibs/worldview/pull/1285)
- Small Style fixes 1269 1265 [\#1274](https://github.com/nasa-gibs/worldview/pull/1274)
- Close layer settings on tab change [\#1273](https://github.com/nasa-gibs/worldview/pull/1273)
- Remove extra palette spacing [\#1272](https://github.com/nasa-gibs/worldview/pull/1272)
- Date selector Adjustments [\#1271](https://github.com/nasa-gibs/worldview/pull/1271)
- Remove granule download item from dialog \#1257 [\#1260](https://github.com/nasa-gibs/worldview/pull/1260)
- Fix layer reordering bug that results in losing layers when toggling projections [\#1255](https://github.com/nasa-gibs/worldview/pull/1255)
- Fix tour break when not in geographic projection [\#1253](https://github.com/nasa-gibs/worldview/pull/1253)
- Fix collapse spacing  [\#1249](https://github.com/nasa-gibs/worldview/pull/1249)
- Update developing docs [\#1240](https://github.com/nasa-gibs/worldview/pull/1240)
- Checkbox label position fix [\#1233](https://github.com/nasa-gibs/worldview/pull/1233)

## [v2.9.0-rc.1](https://github.com/nasa-gibs/worldview/tree/v2.9.0-rc.1) (2018-09-05)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.8.0...v2.9.0-rc.1)

## Technical Updates / Bugfixes:

- update package-lock.json [\#1242](https://github.com/nasa-gibs/worldview/pull/1242)

## Merged PRs:

- Fix tour break when used with A|B [\#1248](https://github.com/nasa-gibs/worldview/pull/1248)
- Update package-lock for wvo-rc.3 [\#1243](https://github.com/nasa-gibs/worldview/pull/1243)
- A|B Comparison Feature [\#1084](https://github.com/nasa-gibs/worldview/pull/1084)

## [v2.8.0](https://github.com/nasa-gibs/worldview/tree/v2.8.0) (2018-09-04)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.9.0-rc.2...v2.8.0)

## [v2.9.0-rc.2](https://github.com/nasa-gibs/worldview/tree/v2.9.0-rc.2) (2018-09-04)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.8.0-rc.4...v2.9.0-rc.2)

## Implemented Enhancements:

- Make overpass times easier to find [\#1207](https://github.com/nasa-gibs/worldview/issues/1207)
- Ability to download data products for MODIS Corrected Reflectance layers [\#1111](https://github.com/nasa-gibs/worldview/issues/1111)
- Timeline should support selecting layers with future dates [\#826](https://github.com/nasa-gibs/worldview/issues/826)

## Technical Updates / Bugfixes:

- Share Checkbox Margin off \[perm.out.short.1\] [\#1232](https://github.com/nasa-gibs/worldview/issues/1232)
- Error sometimes when starting animation [\#1216](https://github.com/nasa-gibs/worldview/issues/1216)
- Check to see if Using Free Download Manager for Windows works with https \[dd.wget.5\] [\#1214](https://github.com/nasa-gibs/worldview/issues/1214)
- Layer-search mobile bug when text is cleared with backspace [\#1213](https://github.com/nasa-gibs/worldview/issues/1213)
- OSX initial build problems with python/virtualenv [\#1212](https://github.com/nasa-gibs/worldview/issues/1212)
- Map location is different in SIT and production [\#1211](https://github.com/nasa-gibs/worldview/issues/1211)
- Animated GIF is not displaying the last 3 days of imagery \[id.gif.4\] [\#1210](https://github.com/nasa-gibs/worldview/issues/1210)
- Zoomed out button allows you to 'click through' to map [\#1201](https://github.com/nasa-gibs/worldview/issues/1201)
- Firefox Zoom +/- button stays white after clicking until next click  [\#1199](https://github.com/nasa-gibs/worldview/issues/1199)
- Tokens not substituted in tour components \[tour.walk.5\] [\#1190](https://github.com/nasa-gibs/worldview/issues/1190)
- Starting tour causes page jump [\#1184](https://github.com/nasa-gibs/worldview/issues/1184)
- Allow layer identifiers with dots [\#1097](https://github.com/nasa-gibs/worldview/issues/1097)

## Closed Issues:

- Build off of deploy branch is failing [\#1225](https://github.com/nasa-gibs/worldview/issues/1225)
- Update end date for Daymet layers in measurements description file [\#1219](https://github.com/nasa-gibs/worldview/issues/1219)
- Add OMPS AI Pyro  [\#1202](https://github.com/nasa-gibs/worldview/issues/1202)
- Rotated map URL is incorrect when you switch projections \[map.rotate.8-9\] [\#1194](https://github.com/nasa-gibs/worldview/issues/1194)
- Now parameter not being used in time range check \[perm.in.date.3\] [\#1188](https://github.com/nasa-gibs/worldview/issues/1188)
- Add GHRC AMSRU2 Sea Ice Concentration/Brightness Temperature [\#1178](https://github.com/nasa-gibs/worldview/issues/1178)
- "i" drop down doesn't work in add layers/search modal \(local machine\) [\#1177](https://github.com/nasa-gibs/worldview/issues/1177)
- Add OMPS products for download [\#1174](https://github.com/nasa-gibs/worldview/issues/1174)
- Convert to webpack [\#1168](https://github.com/nasa-gibs/worldview/issues/1168)
- Fix text in Settlement points layer description [\#1161](https://github.com/nasa-gibs/worldview/issues/1161)
- Remove Population count description [\#1160](https://github.com/nasa-gibs/worldview/issues/1160)
- Add Merra-2 Layers [\#1122](https://github.com/nasa-gibs/worldview/issues/1122)
- Update data provider and other acknowledgements [\#1075](https://github.com/nasa-gibs/worldview/issues/1075)
- Build on RHEL7 [\#883](https://github.com/nasa-gibs/worldview/issues/883)
- Initial vector support implementation [\#556](https://github.com/nasa-gibs/worldview/issues/556)
- Replace Grunt scripts with NPM scripts [\#439](https://github.com/nasa-gibs/worldview/issues/439)

## Merged PRs:

- v2.8.0 [\#1239](https://github.com/nasa-gibs/worldview/pull/1239)
- Update Windows Free Download Manager application instructions for data download [\#1229](https://github.com/nasa-gibs/worldview/pull/1229)

## [v2.8.0-rc.4](https://github.com/nasa-gibs/worldview/tree/v2.8.0-rc.4) (2018-08-28)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.8.0-rc.3...v2.8.0-rc.4)

## Implemented Enhancements:

- Implement a "stale issues" framework [\#712](https://github.com/nasa-gibs/worldview/issues/712)

## Technical Updates / Bugfixes:

- Notification window covers entire viewport [\#1181](https://github.com/nasa-gibs/worldview/issues/1181)
- Can't download large file size GIFs [\#1016](https://github.com/nasa-gibs/worldview/issues/1016)
- IE11 error popup on layer list collapse - can't reproduce error \[layer.add.12\] [\#860](https://github.com/nasa-gibs/worldview/issues/860)

## Closed Issues:

- Update outdated/vulnerable depedencies [\#1125](https://github.com/nasa-gibs/worldview/issues/1125)
- Add disclaimer for NRT- vs Science-based imagery [\#965](https://github.com/nasa-gibs/worldview/issues/965)
- Set up test coverage monitoring [\#692](https://github.com/nasa-gibs/worldview/issues/692)
- Investigate possibility of using advanced animations with webGL [\#562](https://github.com/nasa-gibs/worldview/issues/562)

## Merged PRs:

- Fix build not working with different config environments [\#1227](https://github.com/nasa-gibs/worldview/pull/1227)
- Fix gif bug not displaying the last 3 days of imagery  [\#1226](https://github.com/nasa-gibs/worldview/pull/1226)
- Python-virtualenv build fix [\#1223](https://github.com/nasa-gibs/worldview/pull/1223)

## [v2.8.0-rc.3](https://github.com/nasa-gibs/worldview/tree/v2.8.0-rc.3) (2018-08-22)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.8.0-rc.2...v2.8.0-rc.3)

## Technical Updates / Bugfixes:

- Events may not be visible notification does not appear \[events.notify.3\] [\#1215](https://github.com/nasa-gibs/worldview/issues/1215)
- Temporal coverage for active layers no longer states that it goes up to "present"  [\#1204](https://github.com/nasa-gibs/worldview/issues/1204)
- Truncate selected date to UTC midnight when not subdaily [\#1217](https://github.com/nasa-gibs/worldview/pull/1217)

## Closed Issues:

- Need to change test to an earlier date \[perm.id.date.2\] [\#1191](https://github.com/nasa-gibs/worldview/issues/1191)

## Merged PRs:

- Remove unneeded style [\#1220](https://github.com/nasa-gibs/worldview/pull/1220)
- Remove time adjustment for general case in favor of when needed [\#1218](https://github.com/nasa-gibs/worldview/pull/1218)
- Fix state rotation parameter when switching projections [\#1209](https://github.com/nasa-gibs/worldview/pull/1209)
- Use today for end date in active layers [\#1208](https://github.com/nasa-gibs/worldview/pull/1208)
- Override JQuery UI style for map buttons [\#1203](https://github.com/nasa-gibs/worldview/pull/1203)
- Change tour to not scroll [\#1200](https://github.com/nasa-gibs/worldview/pull/1200)
- Fix missing token replacement bug with dist build and webpack [\#1198](https://github.com/nasa-gibs/worldview/pull/1198)

## [v2.8.0-rc.2](https://github.com/nasa-gibs/worldview/tree/v2.8.0-rc.2) (2018-08-17)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.8.0-rc.1...v2.8.0-rc.2)

## Merged PRs:

- Update for el7 build [\#1197](https://github.com/nasa-gibs/worldview/pull/1197)

## [v2.8.0-rc.1](https://github.com/nasa-gibs/worldview/tree/v2.8.0-rc.1) (2018-08-15)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.7.1...v2.8.0-rc.1)

## Implemented Enhancements:

- Switch build to Webpack [\#1183](https://github.com/nasa-gibs/worldview/pull/1183)

## Closed Issues:

- Assign PO.DAAC layers to specific categories [\#1175](https://github.com/nasa-gibs/worldview/issues/1175)

## Merged PRs:

- updated about section [\#1185](https://github.com/nasa-gibs/worldview/pull/1185)
- Fix configuration build [\#1176](https://github.com/nasa-gibs/worldview/pull/1176)
- Upgrade jquery-ui [\#1167](https://github.com/nasa-gibs/worldview/pull/1167)
- Encode/decode identifiers  [\#1163](https://github.com/nasa-gibs/worldview/pull/1163)
- Multiple products per layer [\#1151](https://github.com/nasa-gibs/worldview/pull/1151)
- Replace Grunt scripts with NPM scripts [\#1144](https://github.com/nasa-gibs/worldview/pull/1144)
- Vector layer support [\#1106](https://github.com/nasa-gibs/worldview/pull/1106)
- Support selecting layers with future dates [\#1091](https://github.com/nasa-gibs/worldview/pull/1091)

## [v2.7.1](https://github.com/nasa-gibs/worldview/tree/v2.7.1) (2018-08-06)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.7.0...v2.7.1)

## Implemented Enhancements:

- For non-paletted layers, don't show option to change color palettes [\#1109](https://github.com/nasa-gibs/worldview/issues/1109)
- Should not be able to select Worldfile for KMZ in image download [\#301](https://github.com/nasa-gibs/worldview/issues/301)

## Technical Updates / Bugfixes:

- Black Marble 2016 only showing on Jan 1 2016 [\#1166](https://github.com/nasa-gibs/worldview/issues/1166)
- Build run watch intermittent re-build issue [\#1137](https://github.com/nasa-gibs/worldview/issues/1137)
- Check for transparent colormap before legend [\#1133](https://github.com/nasa-gibs/worldview/issues/1133)
- Able to drag the start animation dragger off the timeline, into the 'future' [\#1105](https://github.com/nasa-gibs/worldview/issues/1105)
- Guitar pick gets stuck when clicking within GIF animation timeframe [\#1082](https://github.com/nasa-gibs/worldview/issues/1082)
- Scrollbar in data download tab can extend further than expected [\#1064](https://github.com/nasa-gibs/worldview/issues/1064)
- Natural events track clusters/points disappear on max zoom in/out [\#1045](https://github.com/nasa-gibs/worldview/issues/1045)
- Dragging the animation draggers to change the date also changes the time value [\#1023](https://github.com/nasa-gibs/worldview/issues/1023)
- Selection pick gets cut off  [\#905](https://github.com/nasa-gibs/worldview/issues/905)
- Product picker info buttons expand multiple layers at once. [\#624](https://github.com/nasa-gibs/worldview/issues/624)

## Closed Issues:

- Add OMI SSA STD [\#1159](https://github.com/nasa-gibs/worldview/issues/1159)
- Create requirements document for Tour/Tutorial [\#1157](https://github.com/nasa-gibs/worldview/issues/1157)
- Check to see if the Suomi-NPP/OMPS Aerosol Index layer can be wrapped per adjacent day [\#1154](https://github.com/nasa-gibs/worldview/issues/1154)
- Warning appears when using search [\#1145](https://github.com/nasa-gibs/worldview/issues/1145)
- Ignore vscode directory [\#1141](https://github.com/nasa-gibs/worldview/issues/1141)
- GIBS Build Fixes [\#1139](https://github.com/nasa-gibs/worldview/issues/1139)
- OSCAR/TPJ/AVISO/GRACE/SMAP/GHRSST Layers [\#1123](https://github.com/nasa-gibs/worldview/issues/1123)
- Create .md files for IMERG Rain and Snow rates [\#1121](https://github.com/nasa-gibs/worldview/issues/1121)
- Remove GRUMP population count layer [\#1112](https://github.com/nasa-gibs/worldview/issues/1112)
- Update Flood Hazard layer description [\#1110](https://github.com/nasa-gibs/worldview/issues/1110)
- Add colormap to Landsat WELD Tree Cover [\#1094](https://github.com/nasa-gibs/worldview/issues/1094)
- Remove build warnings from unused layers  [\#1038](https://github.com/nasa-gibs/worldview/issues/1038)
- URL Parameters Documentation [\#1029](https://github.com/nasa-gibs/worldview/issues/1029)
- Worldview should use "Client-Id:Worldview" header in requests to CMR  [\#880](https://github.com/nasa-gibs/worldview/issues/880)
- Add mock flag for sub daily imagery [\#866](https://github.com/nasa-gibs/worldview/issues/866)
- The layer settings window does not disappear when the Add layers modal pops up  \[setting.nav.7\] [\#849](https://github.com/nasa-gibs/worldview/issues/849)

## Merged PRs:

- v2.7.1 [\#1179](https://github.com/nasa-gibs/worldview/pull/1179)

## [v2.7.0](https://github.com/nasa-gibs/worldview/tree/v2.7.0) (2018-07-31)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.7.0-rc.3...v2.7.0)

## Implemented Enhancements:

- Create pipeline to create projected + styled raster tiles from vector tiles: Publish pipeline documentation to Github [\#84](https://github.com/nasa-gibs/worldview/issues/84)

## Closed Issues:

- Add Freeze/Thaw geo SMAP layers [\#1132](https://github.com/nasa-gibs/worldview/issues/1132)

## Merged PRs:

- v2.7.0 [\#1171](https://github.com/nasa-gibs/worldview/pull/1171)

## [v2.7.0-rc.3](https://github.com/nasa-gibs/worldview/tree/v2.7.0-rc.3) (2018-07-26)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.7.0-rc.2...v2.7.0-rc.3)

## Merged PRs:

- Fix yearly layer not showing proper range [\#1165](https://github.com/nasa-gibs/worldview/pull/1165)

## [v2.7.0-rc.2](https://github.com/nasa-gibs/worldview/tree/v2.7.0-rc.2) (2018-07-25)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.7.0-rc.1...v2.7.0-rc.2)

## [v2.7.0-rc.1](https://github.com/nasa-gibs/worldview/tree/v2.7.0-rc.1) (2018-07-24)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.6.0...v2.7.0-rc.1)

## Implemented Enhancements:

- Notification Module E2E tests   [\#1040](https://github.com/nasa-gibs/worldview/issues/1040)
- Ability to configure a specific version/collection for data download [\#982](https://github.com/nasa-gibs/worldview/issues/982)
- Update Animated GIF E2E tests [\#819](https://github.com/nasa-gibs/worldview/issues/819)
- Create Mock for Notification Testing [\#806](https://github.com/nasa-gibs/worldview/issues/806)
- Add support for polar projections to natural events feature [\#564](https://github.com/nasa-gibs/worldview/issues/564)

## Technical Updates / Bugfixes:

- Remove layers 'X' in sidebar is slightly too light [\#1115](https://github.com/nasa-gibs/worldview/issues/1115)
- Add layers button jumps down on page load [\#1114](https://github.com/nasa-gibs/worldview/issues/1114)
- Added layers in Layer list are not maintained when you select different types of events [\#1107](https://github.com/nasa-gibs/worldview/issues/1107)
- Slide down panels adjust after animation [\#1089](https://github.com/nasa-gibs/worldview/issues/1089)
- Share modal UI Style bugs [\#1086](https://github.com/nasa-gibs/worldview/issues/1086)
- Style of event-track date tool-tip is off [\#1085](https://github.com/nasa-gibs/worldview/issues/1085)
- Units overlapping colorbar legend [\#1079](https://github.com/nasa-gibs/worldview/issues/1079)
- Zoomed in no events \[layer.zots.7\] [\#1078](https://github.com/nasa-gibs/worldview/issues/1078)
- Bulk Download section is missing from the data download window \[dd.wget.2\] [\#1073](https://github.com/nasa-gibs/worldview/issues/1073)
- Animation download window is not formatted correctly [\#1068](https://github.com/nasa-gibs/worldview/issues/1068)
- Colorbars on dual legend layers are not working independently [\#1067](https://github.com/nasa-gibs/worldview/issues/1067)
- Colorbar units on Cloud Effective Radius layers are unreadable in water phase [\#1065](https://github.com/nasa-gibs/worldview/issues/1065)
- Hover text no longer appears at the dateline [\#1063](https://github.com/nasa-gibs/worldview/issues/1063)
- Add spacing between the radio button and title of product in data download [\#1062](https://github.com/nasa-gibs/worldview/issues/1062)
- Timeline contents are causing container width to increase [\#1061](https://github.com/nasa-gibs/worldview/issues/1061)
- Top Border of animation-dragger is gone [\#1024](https://github.com/nasa-gibs/worldview/issues/1024)
- Data download has bullets visible from unordered list [\#945](https://github.com/nasa-gibs/worldview/issues/945)
- Can drag animation date draggers to future dates \[date.animation.8\] [\#901](https://github.com/nasa-gibs/worldview/issues/901)
- Map zoom in button is enabled outside of test parameters map.zoom.2 [\#847](https://github.com/nasa-gibs/worldview/issues/847)
- Arctic and Antarctic rotations are not independent \[map.rotate.9\] [\#532](https://github.com/nasa-gibs/worldview/issues/532)
- Palette default color not matching map color & not updating \[setting.pal.single.4\] [\#529](https://github.com/nasa-gibs/worldview/issues/529)
- Fix guitar pick and selection draggers from getting cutoff on edges of timeline [\#1147](https://github.com/nasa-gibs/worldview/pull/1147)
- Break up build bundle transforms to run conditionally depending on dev or production [\#1138](https://github.com/nasa-gibs/worldview/pull/1138)
- Fixes unset left property of timeline being called 'auto' in some browsers [\#1136](https://github.com/nasa-gibs/worldview/pull/1136)

## Closed Issues:

- Grunt removal [\#1143](https://github.com/nasa-gibs/worldview/issues/1143)
- Update URL parameters in documentation [\#1124](https://github.com/nasa-gibs/worldview/issues/1124)
- Add SEDAC Batch 2 layers [\#1093](https://github.com/nasa-gibs/worldview/issues/1093)
- Update MODIS LST \(MOD/MYD11\) links [\#1090](https://github.com/nasa-gibs/worldview/issues/1090)
- Fix text in seasonal Landsat layer descriptions [\#1058](https://github.com/nasa-gibs/worldview/issues/1058)
- Remove e2e tests from travis [\#1053](https://github.com/nasa-gibs/worldview/issues/1053)
- Revert to EL6 build [\#1048](https://github.com/nasa-gibs/worldview/issues/1048)
- layer endDate is parsed incorrectly during build [\#1033](https://github.com/nasa-gibs/worldview/issues/1033)
- Update docs with updated e2e testing information [\#1022](https://github.com/nasa-gibs/worldview/issues/1022)
- Fonts should be compressed [\#1019](https://github.com/nasa-gibs/worldview/issues/1019)
- Cleanup deployment script for development [\#1010](https://github.com/nasa-gibs/worldview/issues/1010)
- Update DMSP/SSMI broken link [\#1009](https://github.com/nasa-gibs/worldview/issues/1009)
- Add LPRM A2 Daily STD [\#1007](https://github.com/nasa-gibs/worldview/issues/1007)
- Add SEDAC "Batch 1" BEDI Layers [\#1006](https://github.com/nasa-gibs/worldview/issues/1006)
- Cache node\_modules and .python in Travis builds [\#1001](https://github.com/nasa-gibs/worldview/issues/1001)
- Remove Cucumber.js [\#930](https://github.com/nasa-gibs/worldview/issues/930)
- React Developer Tools message indicates production and development build [\#917](https://github.com/nasa-gibs/worldview/issues/917)
- Add all browser environments to Browserstack [\#700](https://github.com/nasa-gibs/worldview/issues/700)
- Fix bugs that are causing end-to-end tests to fail [\#690](https://github.com/nasa-gibs/worldview/issues/690)
- Fix end-to-end tests that aren't running smoothly [\#689](https://github.com/nasa-gibs/worldview/issues/689)
- Remove layer titles and dates from .md files [\#609](https://github.com/nasa-gibs/worldview/issues/609)
- Script for checking links in metadata/layer description files for 404's [\#520](https://github.com/nasa-gibs/worldview/issues/520)
- Add css helper classes [\#424](https://github.com/nasa-gibs/worldview/issues/424)
- Investigate the possibility of adding normalize.css or another reset file for styles [\#391](https://github.com/nasa-gibs/worldview/issues/391)
- Bring in start/end dates from GC docs into layer descriptions [\#384](https://github.com/nasa-gibs/worldview/issues/384)

## Merged PRs:

- Prevent track and point removal beyond min/max zoom with mousewheel [\#1153](https://github.com/nasa-gibs/worldview/pull/1153)
- Fix date time for animation dragger, GIF dialog text, and updated url [\#1152](https://github.com/nasa-gibs/worldview/pull/1152)
- Update URL parameter documentation [\#1150](https://github.com/nasa-gibs/worldview/pull/1150)
- Close layer setting dialogs when showing Add Layers modal [\#1148](https://github.com/nasa-gibs/worldview/pull/1148)
- Add 'showSubdaily' mock URL parameter \#866 [\#1146](https://github.com/nasa-gibs/worldview/pull/1146)
- Add vscode directory and settings [\#1142](https://github.com/nasa-gibs/worldview/pull/1142)
- Build fixes for GIBS [\#1140](https://github.com/nasa-gibs/worldview/pull/1140)
- Immutable palette now also applies to continuous values [\#1135](https://github.com/nasa-gibs/worldview/pull/1135)
- Check for transparent colormap before legend [\#1134](https://github.com/nasa-gibs/worldview/pull/1134)
- Data download scrollbar overflow [\#1131](https://github.com/nasa-gibs/worldview/pull/1131)
- Remove warnings when GIBS layers are not used [\#1130](https://github.com/nasa-gibs/worldview/pull/1130)
- Add a Worldview client identifier in CMR requests [\#1129](https://github.com/nasa-gibs/worldview/pull/1129)

## [v2.6.0](https://github.com/nasa-gibs/worldview/tree/v2.6.0) (2018-06-26)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.6.0-rc.3...v2.6.0)

## Technical Updates / Bugfixes:

- Event tracks do not consistently show up the first time you click on an event [\#1104](https://github.com/nasa-gibs/worldview/issues/1104)

## Closed Issues:

- A-B: Prototype comparison techniques [\#984](https://github.com/nasa-gibs/worldview/issues/984)

## [v2.6.0-rc.3](https://github.com/nasa-gibs/worldview/tree/v2.6.0-rc.3) (2018-06-22)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.5.2...v2.6.0-rc.3)

## Technical Updates / Bugfixes:

- Non-UTC midnight time appears in permalink [\#1095](https://github.com/nasa-gibs/worldview/issues/1095)
- URL with a set time parameter can throw off image download of daily imagery [\#975](https://github.com/nasa-gibs/worldview/issues/975)
- Update tooltip formatting [\#1092](https://github.com/nasa-gibs/worldview/pull/1092)

## Closed Issues:

- Add 2016-2017 DayMet to WV [\#1051](https://github.com/nasa-gibs/worldview/issues/1051)

## Merged PRs:

- Fix legend overlap [\#1101](https://github.com/nasa-gibs/worldview/pull/1101)
- Fix panels moving when opened [\#1099](https://github.com/nasa-gibs/worldview/pull/1099)
- Print error if an unknown measurement is found [\#1096](https://github.com/nasa-gibs/worldview/pull/1096)
- Share Modal Fixes [\#1087](https://github.com/nasa-gibs/worldview/pull/1087)
- Timeline width fix 1061 [\#1083](https://github.com/nasa-gibs/worldview/pull/1083)
- Fix no 'List All' button in events tab on zoomed in page load [\#1081](https://github.com/nasa-gibs/worldview/pull/1081)

## [v2.5.2](https://github.com/nasa-gibs/worldview/tree/v2.5.2) (2018-06-21)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.6.0-rc.2...v2.5.2)

## Merged PRs:

- Set time to midnight when requesting image download julian date [\#1102](https://github.com/nasa-gibs/worldview/pull/1102)

## [v2.6.0-rc.2](https://github.com/nasa-gibs/worldview/tree/v2.6.0-rc.2) (2018-06-15)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.6.0-rc.1...v2.6.0-rc.2)

## Technical Updates / Bugfixes:

- Legend labels sticky after moving off data point \[layer.legend.4\] [\#1076](https://github.com/nasa-gibs/worldview/issues/1076)
- Add flexbox to fix timeline wrapping bug [\#1071](https://github.com/nasa-gibs/worldview/pull/1071)

## Merged PRs:

- Fix missing bulk download section of data download window [\#1074](https://github.com/nasa-gibs/worldview/pull/1074)
- Fix animation window contents float dropping [\#1070](https://github.com/nasa-gibs/worldview/pull/1070)
- Add space to data download input [\#1069](https://github.com/nasa-gibs/worldview/pull/1069)
- Fix dual colorbar units overlapping [\#1066](https://github.com/nasa-gibs/worldview/pull/1066)
- fix spelling in readme.md [\#1059](https://github.com/nasa-gibs/worldview/pull/1059)

## [v2.6.0-rc.1](https://github.com/nasa-gibs/worldview/tree/v2.6.0-rc.1) (2018-06-13)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.5.1...v2.6.0-rc.1)

## Implemented Enhancements:

- Remove browserstack force flag [\#1030](https://github.com/nasa-gibs/worldview/issues/1030)
- Fix React Dev Tools message flagging dev build and reduce bundle size [\#1044](https://github.com/nasa-gibs/worldview/pull/1044)

## Technical Updates / Bugfixes:

- Fix cut off animation-dragger svg stroke [\#1047](https://github.com/nasa-gibs/worldview/pull/1047)

## Closed Issues:

- Run E2E tests with travis [\#939](https://github.com/nasa-gibs/worldview/issues/939)
- Update Worldview and GIBS FAQ on Earthdata [\#921](https://github.com/nasa-gibs/worldview/issues/921)

## Merged PRs:

- Create npm script to check for 404 links [\#1057](https://github.com/nasa-gibs/worldview/pull/1057)
- Remove old issue template [\#1056](https://github.com/nasa-gibs/worldview/pull/1056)
- Remove e2e tests from travis [\#1054](https://github.com/nasa-gibs/worldview/pull/1054)
- Revert back to EL6 build [\#1049](https://github.com/nasa-gibs/worldview/pull/1049)
- Notification Module End to End tests [\#1043](https://github.com/nasa-gibs/worldview/pull/1043)
- Update issue templates [\#1036](https://github.com/nasa-gibs/worldview/pull/1036)
- Add polar projections support for natural events [\#1027](https://github.com/nasa-gibs/worldview/pull/1027)
- Remove unneeded font formats & add compressed files [\#1020](https://github.com/nasa-gibs/worldview/pull/1020)
- Upload script for development use [\#1018](https://github.com/nasa-gibs/worldview/pull/1018)
- E2e testing foundation [\#1015](https://github.com/nasa-gibs/worldview/pull/1015)
- Data download: Version number by regular expression [\#1005](https://github.com/nasa-gibs/worldview/pull/1005)
- Update RPM to build on el7 [\#981](https://github.com/nasa-gibs/worldview/pull/981)
- Bring start & end dates into layer descriptions automatically [\#920](https://github.com/nasa-gibs/worldview/pull/920)

## [v2.5.1](https://github.com/nasa-gibs/worldview/tree/v2.5.1) (2018-06-05)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.5.0...v2.5.1)

## Implemented Enhancements:

- Create separate bug report and feature request templates [\#1035](https://github.com/nasa-gibs/worldview/issues/1035)
- Increase capacity of animated gif output  [\#816](https://github.com/nasa-gibs/worldview/issues/816)

## Technical Updates / Bugfixes:

- GIF text small size and white bar at bottom \[date.animation.gif\] [\#1013](https://github.com/nasa-gibs/worldview/issues/1013)
- Resetting a rotated arctic image for animated GIF download produces bad animation AND produces an error for image download \[date.animation.gif.7\] [\#1011](https://github.com/nasa-gibs/worldview/issues/1011)
- Animation date draggers not selectable [\#972](https://github.com/nasa-gibs/worldview/issues/972)
- KMZ available for image download in arctic and antarctic projections \[id.init.11\] [\#957](https://github.com/nasa-gibs/worldview/issues/957)
- Running data finicky when multiple layers added [\#910](https://github.com/nasa-gibs/worldview/issues/910)
- Running data values for GPM Rain Rate overlaps color bar [\#909](https://github.com/nasa-gibs/worldview/issues/909)
- IE11 - Download GIF causes blob related invalid address [\#891](https://github.com/nasa-gibs/worldview/issues/891)
- Endless rotate in polar projections [\#877](https://github.com/nasa-gibs/worldview/issues/877)
- Some products which require Earthdata Login for download don't show warning banner [\#814](https://github.com/nasa-gibs/worldview/issues/814)

## Closed Issues:

- Remove Snow Cover Layers [\#1037](https://github.com/nasa-gibs/worldview/issues/1037)
- Fix spelling error with SMAP freeze thaw product [\#1004](https://github.com/nasa-gibs/worldview/issues/1004)
- buster-server isn't killed after testing in Travis [\#1002](https://github.com/nasa-gibs/worldview/issues/1002)
- Fix broken links [\#1000](https://github.com/nasa-gibs/worldview/issues/1000)
- A-B: Plan of action [\#983](https://github.com/nasa-gibs/worldview/issues/983)
- Change url in AMSR-2 Rain and Precip rate descriptions [\#973](https://github.com/nasa-gibs/worldview/issues/973)
- Update AMSR-E Sea Ice Brightness Temp URLs in metadata [\#956](https://github.com/nasa-gibs/worldview/issues/956)
- Add Landsat-7 & Sentinel-2A/2B/5P & NOAA-20 Orbit Tracks [\#940](https://github.com/nasa-gibs/worldview/issues/940)

## Merged PRs:

- v2.5.1 [\#1039](https://github.com/nasa-gibs/worldview/pull/1039)

## [v2.5.0](https://github.com/nasa-gibs/worldview/tree/v2.5.0) (2018-05-30)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.5.0-rc.2...v2.5.0)

## Closed Issues:

- A-B Requirements Review [\#999](https://github.com/nasa-gibs/worldview/issues/999)

## Merged PRs:

- v2.5.0 [\#1026](https://github.com/nasa-gibs/worldview/pull/1026)

## [v2.5.0-rc.2](https://github.com/nasa-gibs/worldview/tree/v2.5.0-rc.2) (2018-05-29)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.5.0-rc.1...v2.5.0-rc.2)

## Technical Updates / Bugfixes:

- Animation Download not working in Internet Explorer \[id.gif.4, date.animation.gif.3-6\] [\#530](https://github.com/nasa-gibs/worldview/issues/530)

## Merged PRs:

- Install supercluster via npm [\#1021](https://github.com/nasa-gibs/worldview/pull/1021)
- Image download and GIF bug fixes [\#1014](https://github.com/nasa-gibs/worldview/pull/1014)

## [v2.5.0-rc.1](https://github.com/nasa-gibs/worldview/tree/v2.5.0-rc.1) (2018-05-22)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.4.0...v2.5.0-rc.1)

## Implemented Enhancements:

- Optimize page served images via compression [\#925](https://github.com/nasa-gibs/worldview/issues/925)
- Update readme image with v2.3.0 interface [\#918](https://github.com/nasa-gibs/worldview/issues/918)
- Welcome to Worldview About window bad link and http links need updating [\#873](https://github.com/nasa-gibs/worldview/issues/873)
- Combine functions that are used by both image-download and animated GIFS [\#825](https://github.com/nasa-gibs/worldview/issues/825)
- Illustrate the movement of multi-day events [\#283](https://github.com/nasa-gibs/worldview/issues/283)

## Technical Updates / Bugfixes:

- Event icon & tracks disappear when changing tabs [\#948](https://github.com/nasa-gibs/worldview/issues/948)
- Subdaily max-time should be today at "now" [\#924](https://github.com/nasa-gibs/worldview/issues/924)
- Smaller screen size causes accordion buttons in add layer categories to cover text [\#888](https://github.com/nasa-gibs/worldview/issues/888)
- GIF Animation info box shows wrong image dimensions [\#823](https://github.com/nasa-gibs/worldview/issues/823)
- Year jumps unexpectedly after guitar pick drag [\#761](https://github.com/nasa-gibs/worldview/issues/761)
- fix vertical align for list items in data download - fixes \#864 [\#946](https://github.com/nasa-gibs/worldview/pull/946)

## Closed Issues:

- Test Suite Documentation Updates [\#971](https://github.com/nasa-gibs/worldview/issues/971)
- Change Landsat orbit designation [\#942](https://github.com/nasa-gibs/worldview/issues/942)
- Fix outstanding lint issues [\#931](https://github.com/nasa-gibs/worldview/issues/931)
- Worldview Options repo incorrectly included in package.json [\#928](https://github.com/nasa-gibs/worldview/issues/928)
- Fix incorrect resolution for MODIS\_Water\_Mask.md [\#879](https://github.com/nasa-gibs/worldview/issues/879)
- Update worldview-components docs on npm [\#727](https://github.com/nasa-gibs/worldview/issues/727)
- Add login instructions to Data download window [\#423](https://github.com/nasa-gibs/worldview/issues/423)
- Add data download handler for VIIRS fires [\#260](https://github.com/nasa-gibs/worldview/issues/260)
- Add WELD Data download handler [\#132](https://github.com/nasa-gibs/worldview/issues/132)

## Merged PRs:

- Travis builds no longer hang and timeout [\#1003](https://github.com/nasa-gibs/worldview/pull/1003)
- Fix gif download blob bug [\#978](https://github.com/nasa-gibs/worldview/pull/978)
- Top half of the animation picker is now selectable [\#977](https://github.com/nasa-gibs/worldview/pull/977)
- Increase gif capacity [\#969](https://github.com/nasa-gibs/worldview/pull/969)
- Runningdata bug fixes [\#968](https://github.com/nasa-gibs/worldview/pull/968)
- Stop rotation when mouse pointer moves off the button [\#967](https://github.com/nasa-gibs/worldview/pull/967)
- Update image download parameters on projection change [\#966](https://github.com/nasa-gibs/worldview/pull/966)
- Changed linter warnings to errors [\#955](https://github.com/nasa-gibs/worldview/pull/955)

## [v2.4.0](https://github.com/nasa-gibs/worldview/tree/v2.4.0) (2018-05-08)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.4.0-rc.2...v2.4.0)

## Merged PRs:

- v2.4.0 [\#974](https://github.com/nasa-gibs/worldview/pull/974)

## [v2.4.0-rc.2](https://github.com/nasa-gibs/worldview/tree/v2.4.0-rc.2) (2018-05-07)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.4.0-rc.1...v2.4.0-rc.2)

## Implemented Enhancements:

- Keep labels and borders on top of other overlays when event is selected [\#550](https://github.com/nasa-gibs/worldview/issues/550)
- better error logging during fetch and config [\#495](https://github.com/nasa-gibs/worldview/issues/495)
- Convert jQuery dialog boxes into react dialog boxes [\#363](https://github.com/nasa-gibs/worldview/issues/363)
- category layers: Running data efficiency [\#200](https://github.com/nasa-gibs/worldview/issues/200)

## Technical Updates / Bugfixes:

- Data download window reappears at unexpected time [\#959](https://github.com/nasa-gibs/worldview/issues/959)
- KMZ not downloading in ZIP when worldfile is selected [\#954](https://github.com/nasa-gibs/worldview/issues/954)
- Feedback form has active console.logs [\#913](https://github.com/nasa-gibs/worldview/issues/913)
- Test plan showing 'no data available' notification \[dd.nocoord.2, dd.size.1\] [\#872](https://github.com/nasa-gibs/worldview/issues/872)
- Zoom for mousescroll and zoom out button cause different zot flag removals \[layer.zots.3\] [\#862](https://github.com/nasa-gibs/worldview/issues/862)
- Image download .zip date is incorrect [\#856](https://github.com/nasa-gibs/worldview/issues/856)
- Fix Sourcemaps for Local Development [\#661](https://github.com/nasa-gibs/worldview/issues/661)
- Natural Events API request error in Firefox [\#649](https://github.com/nasa-gibs/worldview/issues/649)
- dd.urs.3 - 6: Download swath map doesn't update right away [\#214](https://github.com/nasa-gibs/worldview/issues/214)
- iPad: image capture mode can break map [\#61](https://github.com/nasa-gibs/worldview/issues/61)

## Closed Issues:

- Update product for AMSR-E Sea Ice brightness temperature [\#953](https://github.com/nasa-gibs/worldview/issues/953)
- Change TIFF filename to include nasa-worldview brand and date [\#950](https://github.com/nasa-gibs/worldview/issues/950)
- Increase end-to-end test coverage [\#695](https://github.com/nasa-gibs/worldview/issues/695)
- Automate manual test plan [\#694](https://github.com/nasa-gibs/worldview/issues/694)
- Increase unit test coverage [\#693](https://github.com/nasa-gibs/worldview/issues/693)
- Improve Browserstack output [\#691](https://github.com/nasa-gibs/worldview/issues/691)
- Add preventative and reactive code scanning [\#599](https://github.com/nasa-gibs/worldview/issues/599)
- Gruntfile.js HTTP/S proxy [\#330](https://github.com/nasa-gibs/worldview/issues/330)
- Animation error with 'now' permalink flag [\#213](https://github.com/nasa-gibs/worldview/issues/213)
- 'daily' flag being added to every layer's config [\#163](https://github.com/nasa-gibs/worldview/issues/163)

## Merged PRs:

- Fix track disappear when tab changed [\#949](https://github.com/nasa-gibs/worldview/pull/949)

## [v2.4.0-rc.1](https://github.com/nasa-gibs/worldview/tree/v2.4.0-rc.1) (2018-05-01)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.3.1...v2.4.0-rc.1)

## Implemented Enhancements:

- Optimize static images [\#935](https://github.com/nasa-gibs/worldview/pull/935)

## Technical Updates / Bugfixes:

- IE11 style issue - download links table has text that isn't aligned \[dd.link.6\] [\#864](https://github.com/nasa-gibs/worldview/issues/864)
- Fix how options dependency is included [\#929](https://github.com/nasa-gibs/worldview/pull/929)

## Merged PRs:

- Show Tour [\#944](https://github.com/nasa-gibs/worldview/pull/944)
- Revise PR template [\#938](https://github.com/nasa-gibs/worldview/pull/938)
- Allow subdaily max date to extend to "now" local time [\#934](https://github.com/nasa-gibs/worldview/pull/934)
- Lint Fixes [\#932](https://github.com/nasa-gibs/worldview/pull/932)
- WELD data download handler [\#926](https://github.com/nasa-gibs/worldview/pull/926)
- Update main image in README.md [\#919](https://github.com/nasa-gibs/worldview/pull/919)
- Update download instructions [\#916](https://github.com/nasa-gibs/worldview/pull/916)
- changed http to https for EONet url [\#911](https://github.com/nasa-gibs/worldview/pull/911)
- Data download handler: VIIRS fires [\#908](https://github.com/nasa-gibs/worldview/pull/908)
- Update configuration file with subdaily documentation [\#906](https://github.com/nasa-gibs/worldview/pull/906)
- Fix year jump [\#900](https://github.com/nasa-gibs/worldview/pull/900)
- Ignore offline granules in data download [\#899](https://github.com/nasa-gibs/worldview/pull/899)
- Gif improvements [\#897](https://github.com/nasa-gibs/worldview/pull/897)
- Visualize Multi-day Events [\#818](https://github.com/nasa-gibs/worldview/pull/818)

## [v2.3.1](https://github.com/nasa-gibs/worldview/tree/v2.3.1) (2018-05-01)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.3.0...v2.3.1)

## Implemented Enhancements:

- Display sub-daily products using “HH:MM:SS” 24-hour format [\#745](https://github.com/nasa-gibs/worldview/issues/745)
- Incrementally change the currently selected time with "\<" / "\>" buttons [\#744](https://github.com/nasa-gibs/worldview/issues/744)
- Create a github issue template [\#704](https://github.com/nasa-gibs/worldview/issues/704)
- Optimize tile requests for multi-day and sub-daily products [\#149](https://github.com/nasa-gibs/worldview/issues/149)

## Technical Updates / Bugfixes:

- Clicking a new date in the month zoom level increases days input by 1 [\#894](https://github.com/nasa-gibs/worldview/issues/894)
- Edge style - year, month, and day text is being cut off in timeline when using TAB to navigate [\#874](https://github.com/nasa-gibs/worldview/issues/874)
- IE11 Create Animated GIF download button is unresponsive [\#859](https://github.com/nasa-gibs/worldview/issues/859)
- Animation play button unresponsive after cancelling Create An Animated GIF dialog \[date.animation.14\] [\#857](https://github.com/nasa-gibs/worldview/issues/857)
- Unable to change image output options in image-download [\#851](https://github.com/nasa-gibs/worldview/issues/851)
- Changing the opacity of a layer causes the timeline to flicker [\#838](https://github.com/nasa-gibs/worldview/issues/838)
- Image-download bottom-left selection coordinates do not update [\#833](https://github.com/nasa-gibs/worldview/issues/833)
- phantomjs should be replaced with phantomjs-prebuilt [\#828](https://github.com/nasa-gibs/worldview/issues/828)
- DateStamp and nasa-logo overlap when in sub-daily mode [\#815](https://github.com/nasa-gibs/worldview/issues/815)
- GIF Animation icon color does not look correct [\#810](https://github.com/nasa-gibs/worldview/issues/810)
- Gif animation outputs are not contained properly if a large image is selected [\#809](https://github.com/nasa-gibs/worldview/issues/809)
- Build scripts can't handle wmts capabilites with a single layer [\#802](https://github.com/nasa-gibs/worldview/issues/802)
- GIF Animation does not work when selected range is too large [\#801](https://github.com/nasa-gibs/worldview/issues/801)
- Date input text color inconsistency \(ipad\)  [\#796](https://github.com/nasa-gibs/worldview/issues/796)
- Animation pre-cache not working for long selections \[perm.in.anim.3\] [\#795](https://github.com/nasa-gibs/worldview/issues/795)
- Image download in sub-daily is not working with latest develop changes [\#794](https://github.com/nasa-gibs/worldview/issues/794)
- Animation sub-daily drag playback issue [\#789](https://github.com/nasa-gibs/worldview/issues/789)
- Pressing tab after a date input entry no longer enters date \[date.input.8\] [\#787](https://github.com/nasa-gibs/worldview/issues/787)
- Clicking on timeline tab brings you to wrong date \[date.pick.16 & date.pick.25\] [\#786](https://github.com/nasa-gibs/worldview/issues/786)
- Antarctic Notification fired at wrong time \[proj.nav.9 & layer.add.16\] [\#784](https://github.com/nasa-gibs/worldview/issues/784)
- Can't interact with map in collapsed timeline area \[map.pan.7\] [\#782](https://github.com/nasa-gibs/worldview/issues/782)
- Map rotation not loaded \[perm.in.anim.3 & map.init.13\] [\#780](https://github.com/nasa-gibs/worldview/issues/780)
- Timeline zoom level incorrect \[perm.in.anim.1 & perm.in.anim.3\] [\#779](https://github.com/nasa-gibs/worldview/issues/779)
- Fix subdaily timeline bugs [\#770](https://github.com/nasa-gibs/worldview/issues/770)

## Closed Issues:

- \[Removed\] [\#941](https://github.com/nasa-gibs/worldview/issues/941)
- Update references in bulk download from URS to Earthdata Login [\#914](https://github.com/nasa-gibs/worldview/issues/914)
- Python install on macOS should use the --with-brewed-openssl option [\#884](https://github.com/nasa-gibs/worldview/issues/884)
- Change the left / right arrows to reflect zoom level [\#867](https://github.com/nasa-gibs/worldview/issues/867)
- Update documentation to add notes about E2E testing and Unit Testing [\#822](https://github.com/nasa-gibs/worldview/issues/822)
- Remove logic for old Arctic projection [\#821](https://github.com/nasa-gibs/worldview/issues/821)
- Tour content should be updated to reflect timeline changes \[tour.walk.3\] [\#781](https://github.com/nasa-gibs/worldview/issues/781)
- Support subdaily gif animations [\#762](https://github.com/nasa-gibs/worldview/issues/762)
- Timeline should support sub-hourly products [\#749](https://github.com/nasa-gibs/worldview/issues/749)
- Remove warning message and deprecated layers when new 2013 Arctic imagery is available [\#738](https://github.com/nasa-gibs/worldview/issues/738)
- Clarify Documentation About Custom Configurations [\#732](https://github.com/nasa-gibs/worldview/issues/732)
- Add data download handler for OMI and OMPS swaths [\#637](https://github.com/nasa-gibs/worldview/issues/637)

## Merged PRs:

- Change image-download request to use julian dates [\#943](https://github.com/nasa-gibs/worldview/pull/943)

## [v2.3.0](https://github.com/nasa-gibs/worldview/tree/v2.3.0) (2018-04-24)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.3.0-rc.6...v2.3.0)

## Implemented Enhancements:

- Rebase nasa-gibs/gifshot on yahoo/gifshot [\#817](https://github.com/nasa-gibs/worldview/issues/817)

## Closed Issues:

- Adding and editing data handlers [\#720](https://github.com/nasa-gibs/worldview/issues/720)

## Merged PRs:

- v2.3.0 [\#912](https://github.com/nasa-gibs/worldview/pull/912)

## [v2.3.0-rc.6](https://github.com/nasa-gibs/worldview/tree/v2.3.0-rc.6) (2018-04-18)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.3.0-rc.5...v2.3.0-rc.6)

## Closed Issues:

- Change source link or expected result for perm.in.vip.4 [\#846](https://github.com/nasa-gibs/worldview/issues/846)

## Merged PRs:

- Offset day in month zoom [\#896](https://github.com/nasa-gibs/worldview/pull/896)
- Fix monthly zoom days [\#895](https://github.com/nasa-gibs/worldview/pull/895)

## [v2.3.0-rc.5](https://github.com/nasa-gibs/worldview/tree/v2.3.0-rc.5) (2018-04-17)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.3.0-rc.4...v2.3.0-rc.5)

## Merged PRs:

- Added notes for installing python on macOS [\#885](https://github.com/nasa-gibs/worldview/pull/885)
- Fix bars in timeline not changing color with visibility toggle [\#881](https://github.com/nasa-gibs/worldview/pull/881)

## [v2.3.0-rc.4](https://github.com/nasa-gibs/worldview/tree/v2.3.0-rc.4) (2018-04-11)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.3.0-rc.3...v2.3.0-rc.4)

## Technical Updates / Bugfixes:

- Can't change single color custom palette of overlay \[setting.pal.single.1\] [\#876](https://github.com/nasa-gibs/worldview/issues/876)
- IE11 - only opacity available in layer settings \[setting.th.3\] [\#863](https://github.com/nasa-gibs/worldview/issues/863)
- Thresholds not being affected by permalink parameters in IE11 [\#845](https://github.com/nasa-gibs/worldview/issues/845)

## Closed Issues:

- No data to download for AMSR-E Brightness Temp \[dd.nocoords.1 and dd.size.1\] [\#854](https://github.com/nasa-gibs/worldview/issues/854)

## Merged PRs:

- Fix Edge timeline input overlaps [\#875](https://github.com/nasa-gibs/worldview/pull/875)
- Fix slight timeline flicker [\#870](https://github.com/nasa-gibs/worldview/pull/870)
- Add keyboard arrow support per zoom level [\#868](https://github.com/nasa-gibs/worldview/pull/868)
- Animation fix [\#865](https://github.com/nasa-gibs/worldview/pull/865)
- Fix GIF download in IE [\#861](https://github.com/nasa-gibs/worldview/pull/861)

## [v2.3.0-rc.3](https://github.com/nasa-gibs/worldview/tree/v2.3.0-rc.3) (2018-04-05)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.3.0-rc.2...v2.3.0-rc.3)

## Closed Issues:

- Fix issues with test plan [\#837](https://github.com/nasa-gibs/worldview/issues/837)
- Remove old arctic proj tests from test plan [\#836](https://github.com/nasa-gibs/worldview/issues/836)

## Merged PRs:

- Timeline click fix [\#858](https://github.com/nasa-gibs/worldview/pull/858)
- Pass filetype to react component when updated  [\#855](https://github.com/nasa-gibs/worldview/pull/855)
- Correct image-download coordinate labels \#833 [\#842](https://github.com/nasa-gibs/worldview/pull/842)

## [v2.3.0-rc.2](https://github.com/nasa-gibs/worldview/tree/v2.3.0-rc.2) (2018-04-05)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.3.0-rc.1...v2.3.0-rc.2)

## Technical Updates / Bugfixes:

- HH:MMZ is not displayed and zoom level "minutes" is not available in timeline for IE11 [\#853](https://github.com/nasa-gibs/worldview/issues/853)
- IE11 console errors for perm.in.map.3 and perm.in.map.6 [\#843](https://github.com/nasa-gibs/worldview/issues/843)

## Closed Issues:

- Add Natural Earth to test plan expected results perm.in.proj.2 and perm.in.prog.4 [\#844](https://github.com/nasa-gibs/worldview/issues/844)

## Merged PRs:

- Update react & react-dom [\#850](https://github.com/nasa-gibs/worldview/pull/850)
- Fix timeline flicker when adjusting layer attributes [\#840](https://github.com/nasa-gibs/worldview/pull/840)

## [v2.3.0-rc.1](https://github.com/nasa-gibs/worldview/tree/v2.3.0-rc.1) (2018-04-03)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.2.4...v2.3.0-rc.1)

## Implemented Enhancements:

- Create watch/listener that builds css on save in development Environment [\#832](https://github.com/nasa-gibs/worldview/issues/832)

## Technical Updates / Bugfixes:

- Re-enable gzip compression [\#731](https://github.com/nasa-gibs/worldview/issues/731)
- ppc.notify.2  Projection Change Date notification [\#540](https://github.com/nasa-gibs/worldview/issues/540)
- dd.nores.5 \(firefox\) [\#538](https://github.com/nasa-gibs/worldview/issues/538)

## Closed Issues:

- Finalize MODIS events for video [\#799](https://github.com/nasa-gibs/worldview/issues/799)
- dd.nores.3: No data available indicator does not appear [\#215](https://github.com/nasa-gibs/worldview/issues/215)

## Merged PRs:

- Remove old arctic projection logic [\#834](https://github.com/nasa-gibs/worldview/pull/834)
- Change phantomjs to phantomjs-prebuilt and fix lint errors [\#829](https://github.com/nasa-gibs/worldview/pull/829)
- Update pull request template with testing info and create issue template [\#824](https://github.com/nasa-gibs/worldview/pull/824)
- Remove scrollbar by shortening max-height \#809 [\#813](https://github.com/nasa-gibs/worldview/pull/813)
- Set font-family fallback for GIFs [\#812](https://github.com/nasa-gibs/worldview/pull/812)
- Update docs [\#808](https://github.com/nasa-gibs/worldview/pull/808)
- Fix build scripts for handling single layer wmts capabilities [\#803](https://github.com/nasa-gibs/worldview/pull/803)
- Fix rotation permalink load \#780 [\#800](https://github.com/nasa-gibs/worldview/pull/800)
- Sub-daily Timeline [\#778](https://github.com/nasa-gibs/worldview/pull/778)

## [v2.2.4](https://github.com/nasa-gibs/worldview/tree/v2.2.4) (2018-03-21)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.2.3...v2.2.4)

## Technical Updates / Bugfixes:

- Image Download and GIF-generation Break when zoomed out all the way [\#804](https://github.com/nasa-gibs/worldview/issues/804)
- Can't select November or December \[date.field.9\] [\#797](https://github.com/nasa-gibs/worldview/issues/797)
- Initial state of snapshot feature is invalid [\#793](https://github.com/nasa-gibs/worldview/issues/793)

## Closed Issues:

- Collect sample MODIS images/events [\#756](https://github.com/nasa-gibs/worldview/issues/756)

## Merged PRs:

- Gif too many days hotfix [\#805](https://github.com/nasa-gibs/worldview/pull/805)

## [v2.2.3](https://github.com/nasa-gibs/worldview/tree/v2.2.3) (2018-03-16)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.2.2...v2.2.3)

## Merged PRs:

- Worldfile hotfix 3 [\#792](https://github.com/nasa-gibs/worldview/pull/792)
- Worldfile hotfix [\#790](https://github.com/nasa-gibs/worldview/pull/790)
- Release 2.2.2 [\#788](https://github.com/nasa-gibs/worldview/pull/788)

## [v2.2.2](https://github.com/nasa-gibs/worldview/tree/v2.2.2) (2018-03-15)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.2.1...v2.2.2)

## Merged PRs:

- Release 2.2.1 [\#785](https://github.com/nasa-gibs/worldview/pull/785)

## [v2.2.1](https://github.com/nasa-gibs/worldview/tree/v2.2.1) (2018-03-15)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.2.0...v2.2.1)

## Technical Updates / Bugfixes:

- Map Rotation not projection dependent \[map.rotate.9\] [\#783](https://github.com/nasa-gibs/worldview/issues/783)

## Closed Issues:

- Change SRTM layer name and add description [\#774](https://github.com/nasa-gibs/worldview/issues/774)
- Error when clicking out while animating GIF is being created [\#773](https://github.com/nasa-gibs/worldview/issues/773)
- Update test plan for subdaily timeline [\#771](https://github.com/nasa-gibs/worldview/issues/771)
- update chlorophyll a url [\#764](https://github.com/nasa-gibs/worldview/issues/764)
- Remove aoi legacy directory [\#758](https://github.com/nasa-gibs/worldview/issues/758)
- Provide higher resolution options for animation GIFs [\#123](https://github.com/nasa-gibs/worldview/issues/123)

## [v2.2.0](https://github.com/nasa-gibs/worldview/tree/v2.2.0) (2018-03-14)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.1.0...v2.2.0)

## Implemented Enhancements:

- Add "day of year" label on timeline [\#741](https://github.com/nasa-gibs/worldview/issues/741)
- Emphasize satellite for the orbit track layers in the product picker [\#185](https://github.com/nasa-gibs/worldview/issues/185)

## Technical Updates / Bugfixes:

- Webmercator view should not have rotation buttons [\#754](https://github.com/nasa-gibs/worldview/issues/754)
- Timeline broken in Edge 15 [\#502](https://github.com/nasa-gibs/worldview/issues/502)

## Closed Issues:

- Remove inactive tag from CALIPSO Radiance [\#751](https://github.com/nasa-gibs/worldview/issues/751)
- Implement Gitflow approach to feature integration [\#721](https://github.com/nasa-gibs/worldview/issues/721)
- Get GIBS metrics on imagery by type [\#274](https://github.com/nasa-gibs/worldview/issues/274)

## Merged PRs:

- v2.2.0 [\#777](https://github.com/nasa-gibs/worldview/pull/777)

## [v2.1.0](https://github.com/nasa-gibs/worldview/tree/v2.1.0) (2018-02-27)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.0.3...v2.1.0)

## Closed Issues:

- Remove stub.js file  [\#752](https://github.com/nasa-gibs/worldview/issues/752)
- Update MODIS L2 Land start dates [\#737](https://github.com/nasa-gibs/worldview/issues/737)
- Rebuild WV to pick up new MODIS start dates [\#735](https://github.com/nasa-gibs/worldview/issues/735)
- Review timeline requirements [\#734](https://github.com/nasa-gibs/worldview/issues/734)
- GIBS Imagery Review [\#719](https://github.com/nasa-gibs/worldview/issues/719)
- Add MOPITT NRT description [\#715](https://github.com/nasa-gibs/worldview/issues/715)
- Add CERES L3 descriptions [\#714](https://github.com/nasa-gibs/worldview/issues/714)
- Compute max size for animated GIF [\#124](https://github.com/nasa-gibs/worldview/issues/124)

## Merged PRs:

- v2.1.0 [\#765](https://github.com/nasa-gibs/worldview/pull/765)
- Layer daynight attribute check [\#760](https://github.com/nasa-gibs/worldview/pull/760)
- Remove stub.js [\#753](https://github.com/nasa-gibs/worldview/pull/753)
- Detect temporal range on build [\#750](https://github.com/nasa-gibs/worldview/pull/750)
- Add "day of year" label on timeline [\#746](https://github.com/nasa-gibs/worldview/pull/746)

## [v2.0.3](https://github.com/nasa-gibs/worldview/tree/v2.0.3) (2018-02-13)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.0.2...v2.0.3)

## Technical Updates / Bugfixes:

- Need better JS and CSS Cache Busting [\#730](https://github.com/nasa-gibs/worldview/issues/730)
- Console error when switching projections [\#723](https://github.com/nasa-gibs/worldview/issues/723)
- Invalid discrete legend display for colormap with more than 10 LegendEntry [\#626](https://github.com/nasa-gibs/worldview/issues/626)
- Image Download fails to download older Arctic projections \[id.proj.1\] [\#531](https://github.com/nasa-gibs/worldview/issues/531)
- Large "+" buttons in Data Download on initial load \[dd.sel.1\] [\#528](https://github.com/nasa-gibs/worldview/issues/528)
- Category hover values on top of legend boxes [\#523](https://github.com/nasa-gibs/worldview/issues/523)
- When creating an animation, output gif can give bad data if you leave the tab/browser [\#146](https://github.com/nasa-gibs/worldview/issues/146)

## Closed Issues:

- update GA360 Worldview page [\#736](https://github.com/nasa-gibs/worldview/issues/736)
- Update developer information on about page [\#726](https://github.com/nasa-gibs/worldview/issues/726)
- Investigate waffle vs github projects [\#725](https://github.com/nasa-gibs/worldview/issues/725)
- Image download selection appears over layers panel [\#682](https://github.com/nasa-gibs/worldview/issues/682)
- Mobile- Difficulties panning and pinch zooming in Worldview [\#657](https://github.com/nasa-gibs/worldview/issues/657)
- Create plan for A|B Comparison [\#652](https://github.com/nasa-gibs/worldview/issues/652)
- Timeline: better support for differing temporal ranges \(e.g., hourly, monthly, 8-day\) [\#555](https://github.com/nasa-gibs/worldview/issues/555)
- Orbital tracks that belong to multiple categories aren't properly checked in Add Layers modal [\#542](https://github.com/nasa-gibs/worldview/issues/542)
- Event Track Markers [\#468](https://github.com/nasa-gibs/worldview/issues/468)
- Historical Event Browsing [\#467](https://github.com/nasa-gibs/worldview/issues/467)
- Can't close 'select data' data download dialog box [\#434](https://github.com/nasa-gibs/worldview/issues/434)
- Add DAP to Worldview [\#259](https://github.com/nasa-gibs/worldview/issues/259)
- Worldview doesn't seem to respond to clearing browser cache in Firefox [\#218](https://github.com/nasa-gibs/worldview/issues/218)
- Design A|B Comparison [\#107](https://github.com/nasa-gibs/worldview/issues/107)

## Merged PRs:

- 2.0.3 [\#747](https://github.com/nasa-gibs/worldview/pull/747)
- 2.0.3 [\#740](https://github.com/nasa-gibs/worldview/pull/740)
- Release 2.0.2 [\#729](https://github.com/nasa-gibs/worldview/pull/729)

## [v2.0.2](https://github.com/nasa-gibs/worldview/tree/v2.0.2) (2018-01-29)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.0.1...v2.0.2)

## Closed Issues:

- Update contributor documentation to include correct starting point [\#630](https://github.com/nasa-gibs/worldview/issues/630)
- "Loading..." is not removed from sidebar if naturalEvents feature is disabled [\#627](https://github.com/nasa-gibs/worldview/issues/627)
- Contributor guidelines don't mention our branching workflow [\#618](https://github.com/nasa-gibs/worldview/issues/618)

## Merged PRs:

- Fix console error thrown when switching projections [\#724](https://github.com/nasa-gibs/worldview/pull/724)
- Fix granule labels incorrectly positioned in OpenLayers 4.4.x+ [\#722](https://github.com/nasa-gibs/worldview/pull/722)
- Fix legend display [\#717](https://github.com/nasa-gibs/worldview/pull/717)

## [v2.0.1](https://github.com/nasa-gibs/worldview/tree/v2.0.1) (2018-01-24)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/v2.0.0...v2.0.1)

## Closed Issues:

- Add CERES BEDI I general measurements descriptions [\#623](https://github.com/nasa-gibs/worldview/issues/623)
- Check all GES DISC links in layer descriptions [\#569](https://github.com/nasa-gibs/worldview/issues/569)
- Links do not shorten in test environment [\#310](https://github.com/nasa-gibs/worldview/issues/310)

## Merged PRs:

- Remove rotation buttons in webmercator view [\#755](https://github.com/nasa-gibs/worldview/pull/755)
- Update description [\#718](https://github.com/nasa-gibs/worldview/pull/718)

## [v2.0.0](https://github.com/nasa-gibs/worldview/tree/v2.0.0) (2018-01-23)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.11.0...v2.0.0)

## Implemented Enhancements:

- Drag and drop layer order doesn't work on mobile [\#684](https://github.com/nasa-gibs/worldview/issues/684)
- E2e Testing Improvements [\#588](https://github.com/nasa-gibs/worldview/issues/588)
- Update to CERES BEDI I [\#509](https://github.com/nasa-gibs/worldview/issues/509)
- Separate dependencies and devDependencies in the package.json [\#500](https://github.com/nasa-gibs/worldview/issues/500)
- Investigate npm-lock [\#404](https://github.com/nasa-gibs/worldview/issues/404)
- Update tests for the layer models [\#66](https://github.com/nasa-gibs/worldview/issues/66)
- Clean up documentation [\#705](https://github.com/nasa-gibs/worldview/pull/705)

## Technical Updates / Bugfixes:

- Granule selections are not removed when associated layer is removed \[dd.sel.21\] [\#703](https://github.com/nasa-gibs/worldview/issues/703)
- About Page Not Styled on Mobile \[info.about.6\] [\#685](https://github.com/nasa-gibs/worldview/issues/685)
- Granule labels incorrectly positioned \[dd.ams.2\] [\#683](https://github.com/nasa-gibs/worldview/issues/683)
- Layer Debugger Is Broken \[layer.render\] [\#681](https://github.com/nasa-gibs/worldview/issues/681)
- Sometimes drag and drop to change layer order doesn't work on desktop [\#680](https://github.com/nasa-gibs/worldview/issues/680)
- When using `?now` parameter, forward arrow is broken \[date.init.21\]  [\#677](https://github.com/nasa-gibs/worldview/issues/677)
- When switching between projections, rotation display does not update \[map.rotate.9\] [\#675](https://github.com/nasa-gibs/worldview/issues/675)
- 180W has a 1px gap between the dates \[map.init.8\] [\#674](https://github.com/nasa-gibs/worldview/issues/674)
- Feedback form not displaying [\#672](https://github.com/nasa-gibs/worldview/issues/672)
- Invalid attribute in meta viewport tag [\#671](https://github.com/nasa-gibs/worldview/issues/671)
- Style regressions introduced [\#670](https://github.com/nasa-gibs/worldview/issues/670)
- Can not animate custom colormaps \[perm.in.anim.2\] [\#667](https://github.com/nasa-gibs/worldview/issues/667)

## Closed Issues:

- Update current year references [\#673](https://github.com/nasa-gibs/worldview/issues/673)
- Rotation value not dependent on projection \[map.rotate.9\] [\#669](https://github.com/nasa-gibs/worldview/issues/669)
- Animation does not load \[perm.in.anim.2\] [\#668](https://github.com/nasa-gibs/worldview/issues/668)
- Legend needs to accommodate at least 18 categories [\#663](https://github.com/nasa-gibs/worldview/issues/663)
- Fix issue with Polar only Sea Ice layers [\#655](https://github.com/nasa-gibs/worldview/issues/655)
- Add GHRC LIS/OTD/OLS [\#641](https://github.com/nasa-gibs/worldview/issues/641)
- Add SMAP/Sentinel-1 Soil Moisture layer [\#634](https://github.com/nasa-gibs/worldview/issues/634)
- Add OMPS layers [\#633](https://github.com/nasa-gibs/worldview/issues/633)
- Add SMAP/Sentinal-1\_L2 Active Passive Soil Moisture [\#632](https://github.com/nasa-gibs/worldview/issues/632)
- Add CERES L3 BEDI II descriptions [\#622](https://github.com/nasa-gibs/worldview/issues/622)
- Move MOPITT L2 CO NRT to top of layerorder.json [\#621](https://github.com/nasa-gibs/worldview/issues/621)
- Update Configuration documentation to reflect new layer properties [\#602](https://github.com/nasa-gibs/worldview/issues/602)
- Remove startDate from AIRS Temp and RH [\#593](https://github.com/nasa-gibs/worldview/issues/593)
- Adding AIRS L3 Daily STD products [\#552](https://github.com/nasa-gibs/worldview/issues/552)
- Adding CERES L3 BEDI II [\#548](https://github.com/nasa-gibs/worldview/issues/548)
- date.init.7 [\#543](https://github.com/nasa-gibs/worldview/issues/543)
- id.proj.1 Older arctic imagery ins't downloadable [\#536](https://github.com/nasa-gibs/worldview/issues/536)
- setting.pal.single.1 Sea ice custom colormaps don't update on map [\#535](https://github.com/nasa-gibs/worldview/issues/535)
- Add CERES descriptions [\#527](https://github.com/nasa-gibs/worldview/issues/527)
- Add PO.DAAC descriptions [\#521](https://github.com/nasa-gibs/worldview/issues/521)
- Module loaders work [\#494](https://github.com/nasa-gibs/worldview/issues/494)
- Landsat WELD layer descriptions [\#478](https://github.com/nasa-gibs/worldview/issues/478)
- Add Browserstack automated testing  [\#454](https://github.com/nasa-gibs/worldview/issues/454)
- document grunt tasks [\#402](https://github.com/nasa-gibs/worldview/issues/402)
- Verify that development notes are up to date [\#312](https://github.com/nasa-gibs/worldview/issues/312)
- Automate testing for notification module [\#273](https://github.com/nasa-gibs/worldview/issues/273)
- setting.nav.7 [\#225](https://github.com/nasa-gibs/worldview/issues/225)
- dd.link.10 - 11: incorrect links in test plan [\#216](https://github.com/nasa-gibs/worldview/issues/216)

## Merged PRs:

- v2.0.0 Release [\#716](https://github.com/nasa-gibs/worldview/pull/716)
- Fix toolbar modal positioning [\#713](https://github.com/nasa-gibs/worldview/pull/713)
- Prevent tour window from appearing in incorrect position [\#710](https://github.com/nasa-gibs/worldview/pull/710)
- Fix sortable overriding layer controls on Android tablets [\#707](https://github.com/nasa-gibs/worldview/pull/707)
- Revert openlayers to 4.3.4 [\#702](https://github.com/nasa-gibs/worldview/pull/702)
- Fix animating custom colormaps  [\#699](https://github.com/nasa-gibs/worldview/pull/699)
- Add sortable for mobile to layer sidebar  [\#698](https://github.com/nasa-gibs/worldview/pull/698)
- Fix style regressions [\#697](https://github.com/nasa-gibs/worldview/pull/697)
- Fix drag and drop to change layer order not working on desktop [\#696](https://github.com/nasa-gibs/worldview/pull/696)
- Fix debug -/+ buttons not working [\#688](https://github.com/nasa-gibs/worldview/pull/688)
- Update current year [\#687](https://github.com/nasa-gibs/worldview/pull/687)
- Fix babel polyfills not working in IE and older browsers [\#665](https://github.com/nasa-gibs/worldview/pull/665)
- Clean up project structure and simplify build scripts [\#664](https://github.com/nasa-gibs/worldview/pull/664)
- Module loaders file cleanup & add curly brace rule [\#662](https://github.com/nasa-gibs/worldview/pull/662)
- Change import names to be consistent [\#660](https://github.com/nasa-gibs/worldview/pull/660)
- Clean Up Build Scripts [\#659](https://github.com/nasa-gibs/worldview/pull/659)
- Expand lodash function names [\#658](https://github.com/nasa-gibs/worldview/pull/658)
- Finish main.js modularization [\#656](https://github.com/nasa-gibs/worldview/pull/656)
- Modularize Data Download [\#654](https://github.com/nasa-gibs/worldview/pull/654)
- Finish modularizing debug.js [\#653](https://github.com/nasa-gibs/worldview/pull/653)
- Modularize mobile timeline wheel [\#651](https://github.com/nasa-gibs/worldview/pull/651)
- Enable arctic projection change [\#650](https://github.com/nasa-gibs/worldview/pull/650)
- Modularize natural events [\#648](https://github.com/nasa-gibs/worldview/pull/648)
- Update build scripts [\#647](https://github.com/nasa-gibs/worldview/pull/647)
- Add branching clarity for contributors \#630 [\#646](https://github.com/nasa-gibs/worldview/pull/646)
- Module loaders for image download [\#645](https://github.com/nasa-gibs/worldview/pull/645)
- Modularize notification feature [\#644](https://github.com/nasa-gibs/worldview/pull/644)
- Module loaders for animation feature [\#640](https://github.com/nasa-gibs/worldview/pull/640)
- Enable tour features [\#639](https://github.com/nasa-gibs/worldview/pull/639)
- Fix measurement description button not showing full text [\#638](https://github.com/nasa-gibs/worldview/pull/638)
- Fix Buster tests [\#635](https://github.com/nasa-gibs/worldview/pull/635)
- Fix jQuery UI and iCheck style changes [\#631](https://github.com/nasa-gibs/worldview/pull/631)
- Fix dependency errors in core [\#629](https://github.com/nasa-gibs/worldview/pull/629)
- Fix loading text if naturalEvents is not set [\#628](https://github.com/nasa-gibs/worldview/pull/628)
- Remove dependency artifacts and update docs [\#615](https://github.com/nasa-gibs/worldview/pull/615)
- Move ext scripts to dependencies key [\#613](https://github.com/nasa-gibs/worldview/pull/613)
- Fixed tab switching & "add layer" bugs [\#612](https://github.com/nasa-gibs/worldview/pull/612)
- Module loaders [\#503](https://github.com/nasa-gibs/worldview/pull/503)

## [1.11.0](https://github.com/nasa-gibs/worldview/tree/1.11.0) (2017-11-30)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.10.1...1.11.0)

## Technical Updates / Bugfixes:

- Open source projects link is broken on mobile [\#62](https://github.com/nasa-gibs/worldview/issues/62)

## Closed Issues:

- onMouseMove: dataRunner is not triggered if naturalEvent is disabled [\#616](https://github.com/nasa-gibs/worldview/issues/616)
- Layers stay checked in search results even after they've been removed [\#601](https://github.com/nasa-gibs/worldview/issues/601)
- Fix corrected reflectance descriptions [\#591](https://github.com/nasa-gibs/worldview/issues/591)
- Adding GHRC AMSUA- {15,16,17} products [\#554](https://github.com/nasa-gibs/worldview/issues/554)
- Adding CALIPSO BEDI II [\#549](https://github.com/nasa-gibs/worldview/issues/549)
- Add a code of conduct file for GitHub [\#493](https://github.com/nasa-gibs/worldview/issues/493)

## Merged PRs:

- Development [\#625](https://github.com/nasa-gibs/worldview/pull/625)
- Add pull request template [\#620](https://github.com/nasa-gibs/worldview/pull/620)
- Add Code of Conduct [\#619](https://github.com/nasa-gibs/worldview/pull/619)
- Fixed condition for running-data retrievel limit [\#617](https://github.com/nasa-gibs/worldview/pull/617)
- Use semi-standard style [\#590](https://github.com/nasa-gibs/worldview/pull/590)
- E2E Testing Improvements \[WIP\] [\#526](https://github.com/nasa-gibs/worldview/pull/526)
- Add default options repo in worldview [\#517](https://github.com/nasa-gibs/worldview/pull/517)

## [1.10.1](https://github.com/nasa-gibs/worldview/tree/1.10.1) (2017-11-13)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.10.0...1.10.1)

## Closed Issues:

- Overhaul layer description configuration [\#361](https://github.com/nasa-gibs/worldview/issues/361)

## Merged PRs:

- Fix sidebar row spacing issue in Chrome 62 [\#608](https://github.com/nasa-gibs/worldview/pull/608)
- update active layers when layer is added or removed  [\#605](https://github.com/nasa-gibs/worldview/pull/605)
- Fix JS nonce [\#589](https://github.com/nasa-gibs/worldview/pull/589)
- Sort search results by config.layerOrder [\#587](https://github.com/nasa-gibs/worldview/pull/587)
- Restore modal offset [\#586](https://github.com/nasa-gibs/worldview/pull/586)

## [1.10.0](https://github.com/nasa-gibs/worldview/tree/1.10.0) (2017-10-26)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.9.0...1.10.0)

## Technical Updates / Bugfixes:

- Freeze/Thaw measurement not shown in Arctic product picker [\#568](https://github.com/nasa-gibs/worldview/issues/568)
- Classification palette styling issue [\#217](https://github.com/nasa-gibs/worldview/issues/217)

## Closed Issues:

- Fix links to issue tags in the contributing docs [\#570](https://github.com/nasa-gibs/worldview/issues/570)
- Add WELD 5 Year Tree Cover [\#567](https://github.com/nasa-gibs/worldview/issues/567)
- Replace license comments with SPDX ID in package.json [\#565](https://github.com/nasa-gibs/worldview/issues/565)
- Adding SWDB products [\#553](https://github.com/nasa-gibs/worldview/issues/553)
- Add MODIS IST and Snow Cover descriptions [\#545](https://github.com/nasa-gibs/worldview/issues/545)
- Add VIIRS Brightness Temp Day/Night [\#533](https://github.com/nasa-gibs/worldview/issues/533)
- Auto-add IMERG rain to EONET Severe Storms and IMERG snow to Snow events [\#522](https://github.com/nasa-gibs/worldview/issues/522)
- Add IMERG Rain and Snow Rate [\#519](https://github.com/nasa-gibs/worldview/issues/519)
- MISR NRT announcement [\#515](https://github.com/nasa-gibs/worldview/issues/515)
- Add MISR NRT layer descriptions [\#514](https://github.com/nasa-gibs/worldview/issues/514)
- Add `name` to package.json [\#512](https://github.com/nasa-gibs/worldview/issues/512)
- Rewrite descriptions for single layer descriptions [\#511](https://github.com/nasa-gibs/worldview/issues/511)
- Add default Options repo in worldview [\#507](https://github.com/nasa-gibs/worldview/issues/507)
- New AIRS Monthly STD Products  [\#497](https://github.com/nasa-gibs/worldview/issues/497)
- Add configurable modalView options to permalinks documentation [\#332](https://github.com/nasa-gibs/worldview/issues/332)
- Change polar product picker to list of measurements [\#327](https://github.com/nasa-gibs/worldview/issues/327)
- Snapshot doesn't work right with SEDAC's layers [\#318](https://github.com/nasa-gibs/worldview/issues/318)
- Follow up with Jennifer on globe handout [\#306](https://github.com/nasa-gibs/worldview/issues/306)
- Optimize product picker search and load [\#269](https://github.com/nasa-gibs/worldview/issues/269)

## Merged PRs:

- Spacing bug fix [\#585](https://github.com/nasa-gibs/worldview/pull/585)
- Performance fix [\#583](https://github.com/nasa-gibs/worldview/pull/583)
- Only check for descriptions on non-filtered layers when running search [\#580](https://github.com/nasa-gibs/worldview/pull/580)
- Added layer metadata load handling [\#579](https://github.com/nasa-gibs/worldview/pull/579)
- Fix positioning of "i" btn [\#576](https://github.com/nasa-gibs/worldview/pull/576)
- Fix "i" button positioning [\#575](https://github.com/nasa-gibs/worldview/pull/575)
- Search opt patch [\#574](https://github.com/nasa-gibs/worldview/pull/574)
- 1.10.0 [\#573](https://github.com/nasa-gibs/worldview/pull/573)
- Update license info [\#572](https://github.com/nasa-gibs/worldview/pull/572)
- Fix links to issue tags in the contributing docs [\#571](https://github.com/nasa-gibs/worldview/pull/571)
- Search optimization [\#563](https://github.com/nasa-gibs/worldview/pull/563)
- Check if current layer exists before checking for it's projection. [\#547](https://github.com/nasa-gibs/worldview/pull/547)
- UI Bug fixes [\#546](https://github.com/nasa-gibs/worldview/pull/546)

## [1.9.0](https://github.com/nasa-gibs/worldview/tree/1.9.0) (2017-09-25)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.8.0...1.9.0)

## Technical Updates / Bugfixes:

- Event markers lost when refreshing page [\#472](https://github.com/nasa-gibs/worldview/issues/472)
- Reselecting the same event zooms out and back in [\#471](https://github.com/nasa-gibs/worldview/issues/471)
- Preserve Active Layers When Changing Event Date [\#388](https://github.com/nasa-gibs/worldview/issues/388)
- Fires custom colormap does not work [\#189](https://github.com/nasa-gibs/worldview/issues/189)

## Closed Issues:

- Deactivate AIRS CO2 IR STD Layer [\#525](https://github.com/nasa-gibs/worldview/issues/525)
- Update WV Options & WV Component labels to match WV [\#506](https://github.com/nasa-gibs/worldview/issues/506)
- New MOPITT NRT Layer [\#490](https://github.com/nasa-gibs/worldview/issues/490)
- Fix broken AMSR2 URLs [\#489](https://github.com/nasa-gibs/worldview/issues/489)
- Remove option to change color for WMS layers [\#485](https://github.com/nasa-gibs/worldview/issues/485)
- Orbit track descriptions are incorrect in the search results and layer list [\#477](https://github.com/nasa-gibs/worldview/issues/477)
- Add UTC information to Orbit track descriptions [\#475](https://github.com/nasa-gibs/worldview/issues/475)
- Add relevant layers for Water Color category in Events feed [\#473](https://github.com/nasa-gibs/worldview/issues/473)
- Filtering Events [\#466](https://github.com/nasa-gibs/worldview/issues/466)
- "Copy link" button in share feature [\#421](https://github.com/nasa-gibs/worldview/issues/421)
- Show All Active Event Markers on Map [\#407](https://github.com/nasa-gibs/worldview/issues/407)
- Update MISR NRT data download to filter by camera [\#352](https://github.com/nasa-gibs/worldview/issues/352)
- New MISR NRT Layers [\#342](https://github.com/nasa-gibs/worldview/issues/342)
- Add test for removed layers [\#267](https://github.com/nasa-gibs/worldview/issues/267)
- tour.state.1 [\#211](https://github.com/nasa-gibs/worldview/issues/211)
- Investigate/develop style guide for code [\#120](https://github.com/nasa-gibs/worldview/issues/120)

## Merged PRs:

- versioning 1.9.0 [\#544](https://github.com/nasa-gibs/worldview/pull/544)
- v1.9.0 [\#524](https://github.com/nasa-gibs/worldview/pull/524)
- Change polar product picker to list of measurements [\#510](https://github.com/nasa-gibs/worldview/pull/510)
- v1.8.0 [\#508](https://github.com/nasa-gibs/worldview/pull/508)
- Single layer descriptions [\#504](https://github.com/nasa-gibs/worldview/pull/504)
- Overhaul Natural Events Features [\#463](https://github.com/nasa-gibs/worldview/pull/463)

## [1.8.0](https://github.com/nasa-gibs/worldview/tree/1.8.0) (2017-09-08)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.7.1...1.8.0)

## Technical Updates / Bugfixes:

- WV SIT in GIBS environment - Multiple issues [\#491](https://github.com/nasa-gibs/worldview/issues/491)

## Closed Issues:

- Blog posts [\#486](https://github.com/nasa-gibs/worldview/issues/486)
- Degrees in polar projection should always show a positive value [\#465](https://github.com/nasa-gibs/worldview/issues/465)
- Pagination of event date list [\#408](https://github.com/nasa-gibs/worldview/issues/408)
- Update tabs to use two spaces \(!\) instead of four [\#362](https://github.com/nasa-gibs/worldview/issues/362)
- Add developer guidelines [\#276](https://github.com/nasa-gibs/worldview/issues/276)

## Merged PRs:

- Tweaked copy button color [\#505](https://github.com/nasa-gibs/worldview/pull/505)
- Removed capitalizeFirstLetter function, replaced with lodash's startCase [\#499](https://github.com/nasa-gibs/worldview/pull/499)
- Removes option to change color palette for WMS layers [\#487](https://github.com/nasa-gibs/worldview/pull/487)
- Orbit description fix [\#484](https://github.com/nasa-gibs/worldview/pull/484)
- Notification patch [\#483](https://github.com/nasa-gibs/worldview/pull/483)
- Added Copy to Clipboard [\#470](https://github.com/nasa-gibs/worldview/pull/470)

## [1.7.1](https://github.com/nasa-gibs/worldview/tree/1.7.1) (2017-08-24)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.7.0...1.7.1)

## Implemented Enhancements:

- Contributing Doc Should Follow Standards [\#480](https://github.com/nasa-gibs/worldview/issues/480)
- Add a "reset" button [\#92](https://github.com/nasa-gibs/worldview/issues/92)

## Technical Updates / Bugfixes:

- notification module bug [\#482](https://github.com/nasa-gibs/worldview/issues/482)

## Closed Issues:

- Waffle Tags? [\#479](https://github.com/nasa-gibs/worldview/issues/479)
- LocalStorage sometimes causes crash at startup \(especially in Safari\) [\#474](https://github.com/nasa-gibs/worldview/issues/474)
- Add NSIDC MEaSUREs layer descriptions [\#458](https://github.com/nasa-gibs/worldview/issues/458)
- Add MISR Monthly layer descriptions [\#457](https://github.com/nasa-gibs/worldview/issues/457)
- Degrees map when rotated should not exceed 360 degrees. [\#427](https://github.com/nasa-gibs/worldview/issues/427)
- Beautify CSS file so markup follows a consistent pattern \(& add postcss lint plugin to grunt\) [\#425](https://github.com/nasa-gibs/worldview/issues/425)

## Merged PRs:

- Update contributing docs [\#481](https://github.com/nasa-gibs/worldview/pull/481)
- Check localStorage safely [\#476](https://github.com/nasa-gibs/worldview/pull/476)
- v.1.7.0 [\#469](https://github.com/nasa-gibs/worldview/pull/469)

## [1.7.0](https://github.com/nasa-gibs/worldview/tree/1.7.0) (2017-08-11)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.6.1...1.7.0)

## Closed Issues:

- running data fix for id's with periods [\#459](https://github.com/nasa-gibs/worldview/issues/459)

## Merged PRs:

- Patch to fix broken rotate button. Set currentView on rotate button. [\#464](https://github.com/nasa-gibs/worldview/pull/464)
- fixed event logic bug [\#456](https://github.com/nasa-gibs/worldview/pull/456)
- Added style\_guide.md & updated developing.md documentation [\#455](https://github.com/nasa-gibs/worldview/pull/455)
- Reworked `stylelint` and `autoprefix` grunt tasks [\#453](https://github.com/nasa-gibs/worldview/pull/453)
- Fixed files modified after running grunt were slightly different. [\#451](https://github.com/nasa-gibs/worldview/pull/451)
- CSS Overhaul - Added Stylelint rules + stylefmt code formatter tool [\#450](https://github.com/nasa-gibs/worldview/pull/450)
- Add reset function [\#449](https://github.com/nasa-gibs/worldview/pull/449)
- Move `fetch` task to after `update-packages` [\#448](https://github.com/nasa-gibs/worldview/pull/448)
- Fixed alt-dragging in polar projection to always display a value between -360 & 360 degrees [\#447](https://github.com/nasa-gibs/worldview/pull/447)
- Js updates: Added eslint indent rule and adjusted code for this rule [\#444](https://github.com/nasa-gibs/worldview/pull/444)
- JS spacing overhaul [\#443](https://github.com/nasa-gibs/worldview/pull/443)

## [1.6.1](https://github.com/nasa-gibs/worldview/tree/1.6.1) (2017-08-03)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.6.0...1.6.1)

## Closed Issues:

- Update MODIS start dates in layer descriptions [\#437](https://github.com/nasa-gibs/worldview/issues/437)
- Timeline style fix [\#430](https://github.com/nasa-gibs/worldview/issues/430)
- Add NLDAS/GLDAS descriptions [\#418](https://github.com/nasa-gibs/worldview/issues/418)
- New GHRC Lightning Climatology Products [\#415](https://github.com/nasa-gibs/worldview/issues/415)
- Update end date in timeline if browser is open for more than a day [\#409](https://github.com/nasa-gibs/worldview/issues/409)
- Prevent superscript / subscript from affecting line-height [\#394](https://github.com/nasa-gibs/worldview/issues/394)
- Fonts: Implement better cross-browser support [\#393](https://github.com/nasa-gibs/worldview/issues/393)
- npm no longer in Debain 9 'Stretch' [\#383](https://github.com/nasa-gibs/worldview/issues/383)
- Add Sea Ice Concentration descriptions [\#323](https://github.com/nasa-gibs/worldview/issues/323)

## Merged PRs:

- CSS Overhaul Part 1 [\#442](https://github.com/nasa-gibs/worldview/pull/442)

## [1.6.0](https://github.com/nasa-gibs/worldview/tree/1.6.0) (2017-07-27)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.5.0...1.6.0)

## Closed Issues:

- Overzoom indicator is inconsistent across browsers in Antarctic view [\#397](https://github.com/nasa-gibs/worldview/issues/397)
- Update design of notification feature [\#297](https://github.com/nasa-gibs/worldview/issues/297)

## Merged PRs:

- Updated palette box font-size. Removed margin-top around box. [\#436](https://github.com/nasa-gibs/worldview/pull/436)
- 1.6.0 [\#435](https://github.com/nasa-gibs/worldview/pull/435)
- Removed bullets from timeline ul [\#433](https://github.com/nasa-gibs/worldview/pull/433)
- Changed \#timeline-header to fixed width to fix FF on load bug. [\#432](https://github.com/nasa-gibs/worldview/pull/432)
- zot from percent to x [\#431](https://github.com/nasa-gibs/worldview/pull/431)
- Font improvements [\#429](https://github.com/nasa-gibs/worldview/pull/429)
- Alerts rework [\#410](https://github.com/nasa-gibs/worldview/pull/410)
- Force temporal value from options repo [\#387](https://github.com/nasa-gibs/worldview/pull/387)

## [1.5.0](https://github.com/nasa-gibs/worldview/tree/1.5.0) (2017-07-21)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.4.8...1.5.0)

## Implemented Enhancements:

- allow config temporal settings to override gc [\#381](https://github.com/nasa-gibs/worldview/issues/381)
- Update share options for social media [\#140](https://github.com/nasa-gibs/worldview/issues/140)
- Update share icon [\#139](https://github.com/nasa-gibs/worldview/issues/139)

## Technical Updates / Bugfixes:

- Permalink window doesn't fit into Android window when in portrait mode [\#60](https://github.com/nasa-gibs/worldview/issues/60)

## Closed Issues:

- Provide set of use cases for new users [\#413](https://github.com/nasa-gibs/worldview/issues/413)
- CSS overhaul [\#403](https://github.com/nasa-gibs/worldview/issues/403)
- Update GCMD links in GPM layer descriptions [\#401](https://github.com/nasa-gibs/worldview/issues/401)
- e2e testing for layer descriptions [\#400](https://github.com/nasa-gibs/worldview/issues/400)
- End to end testing needs documentation for Windows users [\#385](https://github.com/nasa-gibs/worldview/issues/385)
- Image download for polar projection should always use EPSG:3413 [\#382](https://github.com/nasa-gibs/worldview/issues/382)
- Add data download for MODIS Brightness Temperature [\#378](https://github.com/nasa-gibs/worldview/issues/378)
- Add CSS Autoprefixer as a dev tool [\#372](https://github.com/nasa-gibs/worldview/issues/372)
- Add brightness temperature layers to sea ice category in Events [\#365](https://github.com/nasa-gibs/worldview/issues/365)
- Remove unnecessary SEDAC layers from Polar [\#360](https://github.com/nasa-gibs/worldview/issues/360)
- Add OMI layer descriptions [\#351](https://github.com/nasa-gibs/worldview/issues/351)
- Switch jshint for eslint [\#348](https://github.com/nasa-gibs/worldview/issues/348)
- Font Awesome icons not loading in IE11 [\#338](https://github.com/nasa-gibs/worldview/issues/338)
- Investigate npm install node-gyp contextify issue [\#303](https://github.com/nasa-gibs/worldview/issues/303)
- Reduce zot indicator to 2 decimal places [\#272](https://github.com/nasa-gibs/worldview/issues/272)

## Merged PRs:

- reverted to only shortening link on click \#139 [\#422](https://github.com/nasa-gibs/worldview/pull/422)
- Moved setLink inside of updateLink method. Removed click functionality. [\#420](https://github.com/nasa-gibs/worldview/pull/420)
- Share patch [\#419](https://github.com/nasa-gibs/worldview/pull/419)
- Moved callback function into the setLink promise. [\#417](https://github.com/nasa-gibs/worldview/pull/417)
- Run promise and set variables before setting the social url params [\#416](https://github.com/nasa-gibs/worldview/pull/416)
- Updated og tags. Added wait after setLink to ensure promise runs [\#414](https://github.com/nasa-gibs/worldview/pull/414)
- v1.5.0 [\#412](https://github.com/nasa-gibs/worldview/pull/412)
- Added border between link and share buttons. Added class to link div. [\#411](https://github.com/nasa-gibs/worldview/pull/411)
- Switch linter [\#406](https://github.com/nasa-gibs/worldview/pull/406)
- E2e description test [\#405](https://github.com/nasa-gibs/worldview/pull/405)
- v1.4.8 [\#399](https://github.com/nasa-gibs/worldview/pull/399)
- Social sharing feature [\#398](https://github.com/nasa-gibs/worldview/pull/398)
- Fixed Font Awesome not showing in Internet Explorer [\#396](https://github.com/nasa-gibs/worldview/pull/396)
- Arctic image snapshot fix [\#395](https://github.com/nasa-gibs/worldview/pull/395)
- Updated gruntfile and globals to include comments about Windows config [\#386](https://github.com/nasa-gibs/worldview/pull/386)
- Updated Windows Prerequisites to include Windows Build Tools & Python [\#377](https://github.com/nasa-gibs/worldview/pull/377)
- Added autoprefix task to Grunt [\#376](https://github.com/nasa-gibs/worldview/pull/376)

## [1.4.8](https://github.com/nasa-gibs/worldview/tree/1.4.8) (2017-07-11)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.4.7...1.4.8)

## Implemented Enhancements:

- Add node version requirements to package.json [\#193](https://github.com/nasa-gibs/worldview/issues/193)
- Update readme to include docker [\#166](https://github.com/nasa-gibs/worldview/issues/166)
- Ability to view layer descriptions more easily [\#65](https://github.com/nasa-gibs/worldview/issues/65)

## Closed Issues:

- Activate MISR/MOPITT STD Layers [\#370](https://github.com/nasa-gibs/worldview/issues/370)
- New AMSRU2 Layers [\#369](https://github.com/nasa-gibs/worldview/issues/369)
- Release 1.4.7 [\#359](https://github.com/nasa-gibs/worldview/issues/359)
- Add MERRA descriptions [\#353](https://github.com/nasa-gibs/worldview/issues/353)
- Activate MERRA2/NLDAS/OMI STD Layers [\#343](https://github.com/nasa-gibs/worldview/issues/343)
- Add Aquarius Soil Moisture descriptions [\#333](https://github.com/nasa-gibs/worldview/issues/333)
- Add layer description option to Product Picker search area [\#317](https://github.com/nasa-gibs/worldview/issues/317)
- Add layer description option to Layer List [\#316](https://github.com/nasa-gibs/worldview/issues/316)
- Improve WMTS interoperability [\#314](https://github.com/nasa-gibs/worldview/issues/314)
- Change GPM Snow and Rain Rate end date [\#270](https://github.com/nasa-gibs/worldview/issues/270)
- Consider using svg for WV logo and icons [\#206](https://github.com/nasa-gibs/worldview/issues/206)

## Merged PRs:

- Changed dialog boxes to be opaque. Info text now darker than titles. [\#392](https://github.com/nasa-gibs/worldview/pull/392)
- OpenSans-Light is a truetype font. Lightened description in info modal [\#390](https://github.com/nasa-gibs/worldview/pull/390)
- v1.4.7 [\#380](https://github.com/nasa-gibs/worldview/pull/380)

## [1.4.7](https://github.com/nasa-gibs/worldview/tree/1.4.7) (2017-07-06)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.4.6...1.4.7)

## Implemented Enhancements:

- EONet categories Sea and Lake Ice and Snow should be mapped to specific layers [\#88](https://github.com/nasa-gibs/worldview/issues/88)

## Technical Updates / Bugfixes:

- Fix broken SSMI sea ice data download [\#324](https://github.com/nasa-gibs/worldview/issues/324)
- Worldview TIFF Imagery not mapping correctly [\#87](https://github.com/nasa-gibs/worldview/issues/87)

## External Dependency Updates:

- Add grunt watch  [\#296](https://github.com/nasa-gibs/worldview/issues/296)

## Closed Issues:

- create docker docs in wiki [\#354](https://github.com/nasa-gibs/worldview/issues/354)
- Update GitHub documentation for adding layers into Worldview [\#349](https://github.com/nasa-gibs/worldview/issues/349)
- Fonts in timeline are rendered inconsistently across browsers [\#346](https://github.com/nasa-gibs/worldview/issues/346)
- Change crosshair to only appear when hovering the layer's color box. [\#335](https://github.com/nasa-gibs/worldview/issues/335)
- Remove old metadata tag from layers files [\#325](https://github.com/nasa-gibs/worldview/issues/325)
- Release 1.4.6 [\#322](https://github.com/nasa-gibs/worldview/issues/322)
- Move MISR Albedo to new category [\#321](https://github.com/nasa-gibs/worldview/issues/321)
- Add Daymet descriptions [\#320](https://github.com/nasa-gibs/worldview/issues/320)
- Add permalink specification to GitHub [\#313](https://github.com/nasa-gibs/worldview/issues/313)
- mockEvents debugging no longer works [\#311](https://github.com/nasa-gibs/worldview/issues/311)
- update \# available products in About section [\#308](https://github.com/nasa-gibs/worldview/issues/308)
- Change data download label for SSMI Sea Ice Concentration [\#300](https://github.com/nasa-gibs/worldview/issues/300)
- Change SSMIS Sea Ice Concentration subtitle [\#299](https://github.com/nasa-gibs/worldview/issues/299)
- Remove copied node\_modules from git [\#280](https://github.com/nasa-gibs/worldview/issues/280)
- Events - when there's a list of dates, default to the most recent date [\#226](https://github.com/nasa-gibs/worldview/issues/226)

## Merged PRs:

- Changed title to inline to allow icon to wrap; added padding for icon [\#379](https://github.com/nasa-gibs/worldview/pull/379)
- Improved WMTS interoperability [\#371](https://github.com/nasa-gibs/worldview/pull/371)
- Layer search descriptions [\#368](https://github.com/nasa-gibs/worldview/pull/368)
- warn when correct version of node is not being used [\#367](https://github.com/nasa-gibs/worldview/pull/367)
- Remove node modules [\#366](https://github.com/nasa-gibs/worldview/pull/366)
- Workarounds for GIBS test instances [\#364](https://github.com/nasa-gibs/worldview/pull/364)
- Added info on how to add layers  [\#357](https://github.com/nasa-gibs/worldview/pull/357)

## [1.4.6](https://github.com/nasa-gibs/worldview/tree/1.4.6) (2017-06-28)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.4.5...1.4.6)

## Technical Updates / Bugfixes:

- Fix inconsistent wv.json builds [\#319](https://github.com/nasa-gibs/worldview/issues/319)

## Closed Issues:

- Need new data handler for MISR NRT [\#344](https://github.com/nasa-gibs/worldview/issues/344)
- Installation currently breaking on master [\#339](https://github.com/nasa-gibs/worldview/issues/339)
- \#Installation Section on README.md [\#331](https://github.com/nasa-gibs/worldview/issues/331)
- Release 1.4.5 [\#326](https://github.com/nasa-gibs/worldview/issues/326)
- GIBS imagery review [\#315](https://github.com/nasa-gibs/worldview/issues/315)
- Get Social media ids for sharing [\#305](https://github.com/nasa-gibs/worldview/issues/305)

## Merged PRs:

- Development Branch [\#356](https://github.com/nasa-gibs/worldview/pull/356)
- Reverse tab fix [\#355](https://github.com/nasa-gibs/worldview/pull/355)
- making package versions strict [\#341](https://github.com/nasa-gibs/worldview/pull/341)
- Fixed broken CollectionMix handler \#324 [\#340](https://github.com/nasa-gibs/worldview/pull/340)
- Reverse order of the tracked event dates list [\#295](https://github.com/nasa-gibs/worldview/pull/295)

## [1.4.5](https://github.com/nasa-gibs/worldview/tree/1.4.5) (2017-06-01)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.4.4...1.4.5)

## Implemented Enhancements:

- Simplify Install [\#249](https://github.com/nasa-gibs/worldview/issues/249)

## Closed Issues:

- Compile error version 1.4.5 [\#309](https://github.com/nasa-gibs/worldview/issues/309)
- Find out which new products are coming [\#307](https://github.com/nasa-gibs/worldview/issues/307)
- Update Windows readme for mingw64 [\#302](https://github.com/nasa-gibs/worldview/issues/302)
- Transition to new OMI Nitrogen Dioxide layers [\#298](https://github.com/nasa-gibs/worldview/issues/298)
- Change Blue Marble year in description [\#293](https://github.com/nasa-gibs/worldview/issues/293)
- Add GHRC imagery layer descriptions to Worldview [\#292](https://github.com/nasa-gibs/worldview/issues/292)
- Add MOPITT Descriptions to Worldview [\#291](https://github.com/nasa-gibs/worldview/issues/291)
- Add deployment guidelines to wiki [\#290](https://github.com/nasa-gibs/worldview/issues/290)
- Mark GLDAS as inactive [\#286](https://github.com/nasa-gibs/worldview/issues/286)
- Update NLDAS Underground titles [\#285](https://github.com/nasa-gibs/worldview/issues/285)
- specifying node versions in package.json [\#282](https://github.com/nasa-gibs/worldview/issues/282)
- Add font awesome to package.json [\#281](https://github.com/nasa-gibs/worldview/issues/281)
- Change OMI Nitric Oxide to Nitrogen Dioxide [\#279](https://github.com/nasa-gibs/worldview/issues/279)
- Ensure that blank options template still works [\#278](https://github.com/nasa-gibs/worldview/issues/278)
- Release version 1.4.4 [\#275](https://github.com/nasa-gibs/worldview/issues/275)
- Timeline breaks in edge v15 [\#268](https://github.com/nasa-gibs/worldview/issues/268)
- Add wrap to multi-day day and night layers [\#264](https://github.com/nasa-gibs/worldview/issues/264)
- Port CGI files [\#252](https://github.com/nasa-gibs/worldview/issues/252)
- Create worldview notification component [\#230](https://github.com/nasa-gibs/worldview/issues/230)
- perm.in.vip.4 Test-plan issue [\#210](https://github.com/nasa-gibs/worldview/issues/210)
- Handle EONET events which have more than 10 days of metadata [\#147](https://github.com/nasa-gibs/worldview/issues/147)

## Merged PRs:

- Updated readme documentation to include Windows install prerequisites [\#294](https://github.com/nasa-gibs/worldview/pull/294)
- Install [\#288](https://github.com/nasa-gibs/worldview/pull/288)
- adjusting travis node version [\#287](https://github.com/nasa-gibs/worldview/pull/287)
- Updated install to be Windows-friendly [\#271](https://github.com/nasa-gibs/worldview/pull/271)

## [1.4.4](https://github.com/nasa-gibs/worldview/tree/1.4.4) (2017-05-11)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.4.3...1.4.4)

## Implemented Enhancements:

- Write OMI STD descriptions [\#99](https://github.com/nasa-gibs/worldview/issues/99)
- Write descriptions for MISR, CERES, MOPITT [\#78](https://github.com/nasa-gibs/worldview/issues/78)

## Closed Issues:

- Over-zoom shows at wrong zoom level [\#266](https://github.com/nasa-gibs/worldview/issues/266)
- Add annual title to Black Marble [\#263](https://github.com/nasa-gibs/worldview/issues/263)
- Remove MERRA Products [\#261](https://github.com/nasa-gibs/worldview/issues/261)
- Re-add MODIS Combined AOD product [\#258](https://github.com/nasa-gibs/worldview/issues/258)
- When you return to a specific event in the event tab, it zooms in too close [\#256](https://github.com/nasa-gibs/worldview/issues/256)
- Metrics to WV from Adopt the Planet [\#251](https://github.com/nasa-gibs/worldview/issues/251)
- New layers PoDAAC BEDI Batch II [\#199](https://github.com/nasa-gibs/worldview/issues/199)
- Animation playback in annual mode skips dates [\#160](https://github.com/nasa-gibs/worldview/issues/160)

## Merged PRs:

- Notification module [\#277](https://github.com/nasa-gibs/worldview/pull/277)
- removed zoomLevel from global scope \#256 [\#265](https://github.com/nasa-gibs/worldview/pull/265)

## [1.4.3](https://github.com/nasa-gibs/worldview/tree/1.4.3) (2017-05-03)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.4.2...1.4.3)

## Closed Issues:

- Create designs for notification module [\#255](https://github.com/nasa-gibs/worldview/issues/255)
- Announcement for 1.4.0 release [\#254](https://github.com/nasa-gibs/worldview/issues/254)
- Investigate zoom levels vs incremental levels for permalinks [\#253](https://github.com/nasa-gibs/worldview/issues/253)
- Add Black Marble layers [\#250](https://github.com/nasa-gibs/worldview/issues/250)
- add measures cryo layers [\#246](https://github.com/nasa-gibs/worldview/issues/246)
- add RSS layers [\#244](https://github.com/nasa-gibs/worldview/issues/244)
- add MISR layers [\#243](https://github.com/nasa-gibs/worldview/issues/243)
- remove "enhanced" from SMAP F/T [\#242](https://github.com/nasa-gibs/worldview/issues/242)
- remove wrap from chlorophyll a [\#241](https://github.com/nasa-gibs/worldview/issues/241)
- remove wrap from OMI layers [\#240](https://github.com/nasa-gibs/worldview/issues/240)
- add UV to erythemal layers [\#236](https://github.com/nasa-gibs/worldview/issues/236)
- Add MODIS Snow Cover and Ice Surface Temp [\#228](https://github.com/nasa-gibs/worldview/issues/228)
- New Layers NSIDC - NISE [\#209](https://github.com/nasa-gibs/worldview/issues/209)
- Add new layers to GIBS Available Imagery page [\#161](https://github.com/nasa-gibs/worldview/issues/161)
- Advertise new layers added to Worldview to GIBS Blog [\#157](https://github.com/nasa-gibs/worldview/issues/157)
- Check GIBS Google Maps example [\#122](https://github.com/nasa-gibs/worldview/issues/122)
- Add all new GIBS layers to Worldview [\#121](https://github.com/nasa-gibs/worldview/issues/121)

## Merged PRs:

- fixing animation non-daily playback \#160 [\#262](https://github.com/nasa-gibs/worldview/pull/262)

## [1.4.2](https://github.com/nasa-gibs/worldview/tree/1.4.2) (2017-04-12)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.4.1...1.4.2)

## Technical Updates / Bugfixes:

- Default resolution in image download isn't being set properly [\#245](https://github.com/nasa-gibs/worldview/issues/245)
- polar links are always zoomed out [\#235](https://github.com/nasa-gibs/worldview/issues/235)
- Share-Link Cursor [\#227](https://github.com/nasa-gibs/worldview/issues/227)

## Closed Issues:

- Basic install fails: npm [\#248](https://github.com/nasa-gibs/worldview/issues/248)
- Point SSMIS Sea Ice Concentration to two products [\#234](https://github.com/nasa-gibs/worldview/issues/234)
- Auto-disable layer bug: tool tip is incorrect when layer is first loaded [\#231](https://github.com/nasa-gibs/worldview/issues/231)
- Improve event icon colours [\#223](https://github.com/nasa-gibs/worldview/issues/223)
- Events don't work in IE [\#219](https://github.com/nasa-gibs/worldview/issues/219)
- change anim-icon background color [\#208](https://github.com/nasa-gibs/worldview/issues/208)
- WIndows platform manual installation issues [\#197](https://github.com/nasa-gibs/worldview/issues/197)
- update test plan [\#195](https://github.com/nasa-gibs/worldview/issues/195)
- Install issue on macOS 10.12.3 using vagrant [\#191](https://github.com/nasa-gibs/worldview/issues/191)
- build [\#190](https://github.com/nasa-gibs/worldview/issues/190)
- Change SSMIS Sea Ice Concentration back to active [\#177](https://github.com/nasa-gibs/worldview/issues/177)
- Data download broken for Arctic fires [\#167](https://github.com/nasa-gibs/worldview/issues/167)
- New and Updated SMAP Products [\#164](https://github.com/nasa-gibs/worldview/issues/164)
- Improve Development environment scripts [\#91](https://github.com/nasa-gibs/worldview/issues/91)
- Update data download for MODIS VI when metadata is fixed [\#81](https://github.com/nasa-gibs/worldview/issues/81)

## Merged PRs:

- Added support for downloading collections based on currently selected date [\#247](https://github.com/nasa-gibs/worldview/pull/247)
- Share-link cursor patch [\#238](https://github.com/nasa-gibs/worldview/pull/238)
- Anim-icon background patch [\#237](https://github.com/nasa-gibs/worldview/pull/237)
- Replace WV logo png with svg [\#233](https://github.com/nasa-gibs/worldview/pull/233)
- Improve event icon colours [\#224](https://github.com/nasa-gibs/worldview/pull/224)

## [1.4.1](https://github.com/nasa-gibs/worldview/tree/1.4.1) (2017-04-04)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.4.0...1.4.1)

## Closed Issues:

- Polar permalink doesn't work perfectly [\#221](https://github.com/nasa-gibs/worldview/issues/221)
- Combine new features for v1.4.0 [\#156](https://github.com/nasa-gibs/worldview/issues/156)

## [1.4.0](https://github.com/nasa-gibs/worldview/tree/1.4.0) (2017-03-30)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.3.6...1.4.0)

## Implemented Enhancements:

- Fix permalinks for Event tab [\#118](https://github.com/nasa-gibs/worldview/issues/118)
- Add tooltips or arrows to point to Events [\#117](https://github.com/nasa-gibs/worldview/issues/117)
- Add different icons or colors to denote different types of natural events [\#68](https://github.com/nasa-gibs/worldview/issues/68)

## Technical Updates / Bugfixes:

- Events bug with polar permalink [\#222](https://github.com/nasa-gibs/worldview/issues/222)
- When you move a layer, sometimes you can't activate layers anymore [\#203](https://github.com/nasa-gibs/worldview/issues/203)
- mobile: Rotation buttons in polar projection don't work [\#198](https://github.com/nasa-gibs/worldview/issues/198)
- Shouldn't be able to pan so far left and right that you can't see the map [\#196](https://github.com/nasa-gibs/worldview/issues/196)
- Permalink unexpectedly auto-added to URL bar at startup [\#194](https://github.com/nasa-gibs/worldview/issues/194)
- Can't click event link [\#192](https://github.com/nasa-gibs/worldview/issues/192)
- Test instance is slow sometimes in Firefox [\#186](https://github.com/nasa-gibs/worldview/issues/186)
- Changing color palette sometimes turns off the layer and can't be turned back on again [\#184](https://github.com/nasa-gibs/worldview/issues/184)
- Running data issue for Orbit Tracks [\#180](https://github.com/nasa-gibs/worldview/issues/180)
- Clicking on "shorten link" breaks the other buttons [\#178](https://github.com/nasa-gibs/worldview/issues/178)
- Running data doesn't work for some layers in all views [\#176](https://github.com/nasa-gibs/worldview/issues/176)
- Site breaks when loaded in arctic view [\#175](https://github.com/nasa-gibs/worldview/issues/175)
- Running data doesn't work for some layers in Antarctic [\#174](https://github.com/nasa-gibs/worldview/issues/174)
- Running data doesn't work for Day/Night Band in Geo and polar views [\#173](https://github.com/nasa-gibs/worldview/issues/173)
- Pole mask text for Sea Ice Concentration in wrong place [\#172](https://github.com/nasa-gibs/worldview/issues/172)
- Running data doesn't work for some layers in Arctic [\#171](https://github.com/nasa-gibs/worldview/issues/171)

## Closed Issues:

- map.init.2 [\#212](https://github.com/nasa-gibs/worldview/issues/212)
- Iceberg events use sea and lake ice icon [\#205](https://github.com/nasa-gibs/worldview/issues/205)
- Replace 'beforeRender' where present [\#204](https://github.com/nasa-gibs/worldview/issues/204)
- Disable running data in mobile views [\#201](https://github.com/nasa-gibs/worldview/issues/201)
- Correct Zoom Level Events [\#188](https://github.com/nasa-gibs/worldview/issues/188)
- Error on layer remove [\#187](https://github.com/nasa-gibs/worldview/issues/187)
- Activating the VM breaks while trying tou build guest additions. [\#183](https://github.com/nasa-gibs/worldview/issues/183)
- New Daymet Layers [\#168](https://github.com/nasa-gibs/worldview/issues/168)
- Add new layers to GIBS Available Imagery page [\#162](https://github.com/nasa-gibs/worldview/issues/162)
- Change SSMIS Sea Ice Concentration to inactive=true [\#159](https://github.com/nasa-gibs/worldview/issues/159)
- update to OL 4 [\#154](https://github.com/nasa-gibs/worldview/issues/154)
- Hardcode start/end dates for non-daily layers [\#153](https://github.com/nasa-gibs/worldview/issues/153)
- Hardcode start/end dates for Lightning layers [\#152](https://github.com/nasa-gibs/worldview/issues/152)
- End dates of non-daily layers are not being properly set [\#150](https://github.com/nasa-gibs/worldview/issues/150)
- change 'wraps' flag to 'datewraps' [\#145](https://github.com/nasa-gibs/worldview/issues/145)
- Fix clicking on/off issue with Events [\#141](https://github.com/nasa-gibs/worldview/issues/141)
- Add dateline config to relevant layers [\#138](https://github.com/nasa-gibs/worldview/issues/138)
- Add weekly Aquarius layer [\#136](https://github.com/nasa-gibs/worldview/issues/136)
- Make dateline-wrap code more dynamic [\#135](https://github.com/nasa-gibs/worldview/issues/135)
- Add MERRA products [\#127](https://github.com/nasa-gibs/worldview/issues/127)
- Add OMI UV products [\#126](https://github.com/nasa-gibs/worldview/issues/126)
- Add LDAS Monthly products [\#125](https://github.com/nasa-gibs/worldview/issues/125)
- Implement: Over anti-meridian/dateline Visualization [\#110](https://github.com/nasa-gibs/worldview/issues/110)

## Merged PRs:

- Testing 1.4.0 [\#202](https://github.com/nasa-gibs/worldview/pull/202)
- Build updates [\#170](https://github.com/nasa-gibs/worldview/pull/170)
- Add new events icons [\#143](https://github.com/nasa-gibs/worldview/pull/143)

## [1.3.6](https://github.com/nasa-gibs/worldview/tree/1.3.6) (2017-02-27)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.3.5...1.3.6)

## Technical Updates / Bugfixes:

- WV not loading in UAT with new Chrome Version [\#86](https://github.com/nasa-gibs/worldview/issues/86)

## Closed Issues:

- Add build.sh script [\#165](https://github.com/nasa-gibs/worldview/issues/165)
- Add AMSR2 Land layers [\#131](https://github.com/nasa-gibs/worldview/issues/131)

## [1.3.5](https://github.com/nasa-gibs/worldview/tree/1.3.5) (2017-02-21)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.3.4...1.3.5)

## Implemented Enhancements:

- adjust label category layers [\#158](https://github.com/nasa-gibs/worldview/issues/158)
- Running data optimization [\#77](https://github.com/nasa-gibs/worldview/issues/77)

## Technical Updates / Bugfixes:

- URL for squashed palettes does not maintain max value [\#142](https://github.com/nasa-gibs/worldview/issues/142)

## Closed Issues:

- Zoom Button fix - OL4 migration [\#155](https://github.com/nasa-gibs/worldview/issues/155)
- Hardcode start/end dates for WELD layers [\#151](https://github.com/nasa-gibs/worldview/issues/151)
- Update AOD and AAOD layer names [\#148](https://github.com/nasa-gibs/worldview/issues/148)
- Migrate "grunt fetch" to use https [\#144](https://github.com/nasa-gibs/worldview/issues/144)
- Update dateline tooltip when date changes [\#137](https://github.com/nasa-gibs/worldview/issues/137)

## [1.3.4](https://github.com/nasa-gibs/worldview/tree/1.3.4) (2017-02-09)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.3.3...1.3.4)

## Implemented Enhancements:

- animation widget -- safari style problems [\#129](https://github.com/nasa-gibs/worldview/issues/129)
- Add fire layers to Arctic projection [\#98](https://github.com/nasa-gibs/worldview/issues/98)
- Upgrade usage of EONET API from v1 to v2.1 [\#82](https://github.com/nasa-gibs/worldview/issues/82)

## Technical Updates / Bugfixes:

- Hovering over blue dot in Frames per second gives URL [\#128](https://github.com/nasa-gibs/worldview/issues/128)

## Closed Issues:

- fix latitude values of wrapped imagery [\#134](https://github.com/nasa-gibs/worldview/issues/134)
- Fix permalinks for dateline-wrap feature [\#133](https://github.com/nasa-gibs/worldview/issues/133)
- Blog post for VIIRS DNB [\#119](https://github.com/nasa-gibs/worldview/issues/119)
- Prevent error when GA is blocked by ad blocker [\#116](https://github.com/nasa-gibs/worldview/issues/116)
- Add new GIBS layers to imagery products page [\#113](https://github.com/nasa-gibs/worldview/issues/113)
- Add new OMI STD Layers [\#93](https://github.com/nasa-gibs/worldview/issues/93)

## [1.3.3](https://github.com/nasa-gibs/worldview/tree/1.3.3) (2017-01-18)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.3.2...1.3.3)

## Implemented Enhancements:

- Animation-GIF style adjusts [\#103](https://github.com/nasa-gibs/worldview/issues/103)
- Worldview/GIBS blog post [\#100](https://github.com/nasa-gibs/worldview/issues/100)
- Investigate how to bring in start/end dates from GC docs into layer descriptions [\#80](https://github.com/nasa-gibs/worldview/issues/80)

## Technical Updates / Bugfixes:

- Animation GIF not showing borders and Place names [\#106](https://github.com/nasa-gibs/worldview/issues/106)

## Closed Issues:

- Allow slower animation speeds [\#114](https://github.com/nasa-gibs/worldview/issues/114)
- Design Over anti-meridian/dateline Visualization [\#109](https://github.com/nasa-gibs/worldview/issues/109)
- Remove old palette legend [\#105](https://github.com/nasa-gibs/worldview/issues/105)
- Investigate horizontal scrolling date change [\#104](https://github.com/nasa-gibs/worldview/issues/104)
- WV doesn't support time values in the time dimension [\#95](https://github.com/nasa-gibs/worldview/issues/95)
- Update WV ColorMap parsing to happen ref w/ no id [\#94](https://github.com/nasa-gibs/worldview/issues/94)
- Write description for VIIRS DNB [\#90](https://github.com/nasa-gibs/worldview/issues/90)
- Running data should handle colormaps with duplicate entries [\#89](https://github.com/nasa-gibs/worldview/issues/89)
- Create pipeline to create projected + styled raster tiles from vector tiles: Cache vector tiles at least on a per-session basis to prevent duplicate requests [\#83](https://github.com/nasa-gibs/worldview/issues/83)
- Automate Animation test plan [\#79](https://github.com/nasa-gibs/worldview/issues/79)
- Add MODIS VI, GHRC SSMI, NSIDC Sea Ice and Soil Moisture to GIBS imagery wiki page [\#76](https://github.com/nasa-gibs/worldview/issues/76)
- Some old, shortened URLs on GIBS Products page give error [\#75](https://github.com/nasa-gibs/worldview/issues/75)
- Install Help - box not found [\#73](https://github.com/nasa-gibs/worldview/issues/73)

## Merged PRs:

- Gif stamp [\#112](https://github.com/nasa-gibs/worldview/pull/112)
- Analytics [\#74](https://github.com/nasa-gibs/worldview/pull/74)

## [1.3.2](https://github.com/nasa-gibs/worldview/tree/1.3.2) (2016-11-28)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.3.1...1.3.2)

## Closed Issues:

- Date can change unexpectedly when dragging map [\#64](https://github.com/nasa-gibs/worldview/issues/64)

## Merged PRs:

- Gifshot fixes [\#72](https://github.com/nasa-gibs/worldview/pull/72)

## [1.3.1](https://github.com/nasa-gibs/worldview/tree/1.3.1) (2016-11-09)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.3.0-2...1.3.1)

## Merged PRs:

- Animation config [\#71](https://github.com/nasa-gibs/worldview/pull/71)
- Updated data download to use CMR endpoints rather than ECHO [\#70](https://github.com/nasa-gibs/worldview/pull/70)

## [1.3.0-2](https://github.com/nasa-gibs/worldview/tree/1.3.0-2) (2016-11-03)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.3...1.3.0-2)

## [1.3](https://github.com/nasa-gibs/worldview/tree/1.3) (2016-10-31)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.2.3...1.3)

## Closed Issues:

- Instructions for manual installation with worldview-options-template don't work [\#54](https://github.com/nasa-gibs/worldview/issues/54)

## Merged PRs:

- Animation gif react [\#69](https://github.com/nasa-gibs/worldview/pull/69)

## [1.2.3](https://github.com/nasa-gibs/worldview/tree/1.2.3) (2016-10-06)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.2.2...1.2.3)

## Merged PRs:

- Contributing doc [\#59](https://github.com/nasa-gibs/worldview/pull/59)

## [1.2.2](https://github.com/nasa-gibs/worldview/tree/1.2.2) (2016-08-30)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.2...1.2.2)

## Merged PRs:

- Image download auto-selection of resolution [\#57](https://github.com/nasa-gibs/worldview/pull/57)
- Events enhancements [\#56](https://github.com/nasa-gibs/worldview/pull/56)
- Fixed problem with layer zots incorrectly appearing in polar views [\#55](https://github.com/nasa-gibs/worldview/pull/55)

## [1.2](https://github.com/nasa-gibs/worldview/tree/1.2) (2016-08-24)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.1...1.2)

## Closed Issues:

- buster.js version breaks npm build with node v4.4.7 [\#52](https://github.com/nasa-gibs/worldview/issues/52)
- Vagrant not building the wv-options config correctly [\#50](https://github.com/nasa-gibs/worldview/issues/50)
- Vagrant not building due to epel-release  [\#49](https://github.com/nasa-gibs/worldview/issues/49)

## Merged PRs:

- Now making map zoom in extra far for fire events [\#53](https://github.com/nasa-gibs/worldview/pull/53)

## [1.1](https://github.com/nasa-gibs/worldview/tree/1.1) (2016-06-21)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.0.1...1.1)

## Closed Issues:

- Degree symbol for Kelvin scale [\#51](https://github.com/nasa-gibs/worldview/issues/51)

## [1.0.1](https://github.com/nasa-gibs/worldview/tree/1.0.1) (2016-03-22)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/1.0...1.0.1)

## [1.0](https://github.com/nasa-gibs/worldview/tree/1.0) (2016-02-18)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.9.0...1.0)

## Merged PRs:

- fix typo in link to VirtualBox [\#48](https://github.com/nasa-gibs/worldview/pull/48)

## [0.9.0](https://github.com/nasa-gibs/worldview/tree/0.9.0) (2015-12-09)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.8.10...0.9.0)

## [0.8.10](https://github.com/nasa-gibs/worldview/tree/0.8.10) (2015-11-16)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.8.9...0.8.10)

## [0.8.9](https://github.com/nasa-gibs/worldview/tree/0.8.9) (2015-10-22)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.8.8...0.8.9)

## Merged PRs:

- Wv 1244.overzooming [\#34](https://github.com/nasa-gibs/worldview/pull/34)
- GDEM [\#31](https://github.com/nasa-gibs/worldview/pull/31)

## [0.8.8](https://github.com/nasa-gibs/worldview/tree/0.8.8) (2015-09-03)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.8.7...0.8.8)

## [0.8.7](https://github.com/nasa-gibs/worldview/tree/0.8.7) (2015-09-01)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.8.6...0.8.7)

## [0.8.6](https://github.com/nasa-gibs/worldview/tree/0.8.6) (2015-08-21)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.8.5...0.8.6)

## [0.8.5](https://github.com/nasa-gibs/worldview/tree/0.8.5) (2015-08-05)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.8.4...0.8.5)

## Merged PRs:

- Fixed button CSS to be gray not teal [\#44](https://github.com/nasa-gibs/worldview/pull/44)
- WV-1383: Polar rotations [\#42](https://github.com/nasa-gibs/worldview/pull/42)
- Jquery up [\#41](https://github.com/nasa-gibs/worldview/pull/41)

## [0.8.4](https://github.com/nasa-gibs/worldview/tree/0.8.4) (2015-06-30)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.8.3...0.8.4)

## Merged PRs:

- Revert "Play Button" [\#39](https://github.com/nasa-gibs/worldview/pull/39)
- Play Button [\#38](https://github.com/nasa-gibs/worldview/pull/38)
- WV-1421: --env support pulled from colormaps-modis-c6 branch [\#37](https://github.com/nasa-gibs/worldview/pull/37)
- Windows gruntfile [\#36](https://github.com/nasa-gibs/worldview/pull/36)
- Added a Windows compatiable Gruntfile. Build notes for Windows coming… [\#35](https://github.com/nasa-gibs/worldview/pull/35)

## [0.8.3](https://github.com/nasa-gibs/worldview/tree/0.8.3) (2015-06-01)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.8.2...0.8.3)

## [0.8.2](https://github.com/nasa-gibs/worldview/tree/0.8.2) (2015-05-15)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.8.1...0.8.2)

## Merged PRs:

- LatLong: Customize format, image download crop bounds [\#32](https://github.com/nasa-gibs/worldview/pull/32)
- Show warning when geographic graticule layer is enabled for image download [\#30](https://github.com/nasa-gibs/worldview/pull/30)

## [0.8.1](https://github.com/nasa-gibs/worldview/tree/0.8.1) (2015-04-16)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.8.0...0.8.1)

## Merged PRs:

- WV-1364: Layer visibility toggle doesn't work with geographic graticule [\#29](https://github.com/nasa-gibs/worldview/pull/29)
- No anim zoom [\#28](https://github.com/nasa-gibs/worldview/pull/28)
- Wv 1245.timeline code update [\#26](https://github.com/nasa-gibs/worldview/pull/26)
- Upgrade to OpenLayers 3.3.0 [\#25](https://github.com/nasa-gibs/worldview/pull/25)
- WV-1256: Colorbar Squashing [\#24](https://github.com/nasa-gibs/worldview/pull/24)
- WV-1319: Change ECHO references to CMR [\#23](https://github.com/nasa-gibs/worldview/pull/23)

## [0.8.0](https://github.com/nasa-gibs/worldview/tree/0.8.0) (2015-02-24)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.7.2...0.8.0)

## Merged PRs:

- OpenLayers 3 Integration [\#22](https://github.com/nasa-gibs/worldview/pull/22)
- Sidebar and timeline collapsed/expanded state now saved in local storage [\#21](https://github.com/nasa-gibs/worldview/pull/21)

## [0.7.2](https://github.com/nasa-gibs/worldview/tree/0.7.2) (2015-01-22)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.7.1...0.7.2)

## Merged PRs:

- WV-1096: If all layers are static, do not initialize time components [\#20](https://github.com/nasa-gibs/worldview/pull/20)
- WV-1205: Clarification in tour text [\#19](https://github.com/nasa-gibs/worldview/pull/19)
- WV-1226: Typographic corrections to tour [\#18](https://github.com/nasa-gibs/worldview/pull/18)
- WTMS GC documents only fetched upon request [\#17](https://github.com/nasa-gibs/worldview/pull/17)

## [0.7.1](https://github.com/nasa-gibs/worldview/tree/0.7.1) (2014-12-24)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.7.0...0.7.1)

## Merged PRs:

- Wv 1071.e w scrolling with mouse pans timeline [\#16](https://github.com/nasa-gibs/worldview/pull/16)
- WV-1095: \_.each changed to \_.forOwn when creating maps.  [\#15](https://github.com/nasa-gibs/worldview/pull/15)
- WV-1214: Web fonts now work in IE11 over https if all caching headers are removed [\#14](https://github.com/nasa-gibs/worldview/pull/14)
- WV-1143,1142: Coordinate display now lat/lon with degrees, minutes, seconds [\#13](https://github.com/nasa-gibs/worldview/pull/13)
- WV-1219 z-index of collapsed layer list fixed [\#12](https://github.com/nasa-gibs/worldview/pull/12)
- wv-1217 data Download font size increase [\#11](https://github.com/nasa-gibs/worldview/pull/11)
- wv-1148.pick\_scroll\_dates [\#10](https://github.com/nasa-gibs/worldview/pull/10)
- WV-1218: A blank tab/window no longer shows up when the feedback button is a mailto link [\#9](https://github.com/nasa-gibs/worldview/pull/9)
- WV-1178 More consistent pick movement over years [\#8](https://github.com/nasa-gibs/worldview/pull/8)
- WV-1144: Opacity values are now clamped to 0-1 in permalink [\#7](https://github.com/nasa-gibs/worldview/pull/7)
- WV-1146: Timeline expands if collapsed during the tour [\#6](https://github.com/nasa-gibs/worldview/pull/6)
- WV-1202: Tabs no longer change on arrow keys if it has focus [\#5](https://github.com/nasa-gibs/worldview/pull/5)
- WV-1129: Map is now properly centered on mobile devices [\#4](https://github.com/nasa-gibs/worldview/pull/4)

## [0.7.0](https://github.com/nasa-gibs/worldview/tree/0.7.0) (2014-12-08)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/modis-c6-demo...0.7.0)

## Merged PRs:

- Changing to a CDN version of Font Awesome to make it work with IE11. [\#3](https://github.com/nasa-gibs/worldview/pull/3)

## [modis-c6-demo](https://github.com/nasa-gibs/worldview/tree/modis-c6-demo) (2014-10-22)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.6.9...modis-c6-demo)

## [0.6.9](https://github.com/nasa-gibs/worldview/tree/0.6.9) (2014-09-18)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.6.8...0.6.9)

## [0.6.8](https://github.com/nasa-gibs/worldview/tree/0.6.8) (2014-08-25)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.6.7...0.6.8)

## [0.6.7](https://github.com/nasa-gibs/worldview/tree/0.6.7) (2014-05-29)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.6.6-2...0.6.7)

## [0.6.6-2](https://github.com/nasa-gibs/worldview/tree/0.6.6-2) (2014-05-15)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.6.6...0.6.6-2)

## [0.6.6](https://github.com/nasa-gibs/worldview/tree/0.6.6) (2014-04-28)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.6.5...0.6.6)

## [0.6.5](https://github.com/nasa-gibs/worldview/tree/0.6.5) (2014-04-07)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.6.4...0.6.5)

## [0.6.4](https://github.com/nasa-gibs/worldview/tree/0.6.4) (2014-03-11)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.6.3...0.6.4)

## [0.6.3](https://github.com/nasa-gibs/worldview/tree/0.6.3) (2014-03-03)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.6.2...0.6.3)

## [0.6.2](https://github.com/nasa-gibs/worldview/tree/0.6.2) (2014-01-15)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.6.1...0.6.2)

## [0.6.1](https://github.com/nasa-gibs/worldview/tree/0.6.1) (2013-11-18)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.6.0...0.6.1)

## [0.6.0](https://github.com/nasa-gibs/worldview/tree/0.6.0) (2013-10-30)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.5.2...0.6.0)

## [0.5.2](https://github.com/nasa-gibs/worldview/tree/0.5.2) (2013-09-25)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.5.1-1...0.5.2)

## [0.5.1-1](https://github.com/nasa-gibs/worldview/tree/0.5.1-1) (2013-08-22)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.5.1...0.5.1-1)

## [0.5.1](https://github.com/nasa-gibs/worldview/tree/0.5.1) (2013-08-15)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.5.0...0.5.1)

## [0.5.0](https://github.com/nasa-gibs/worldview/tree/0.5.0) (2013-07-17)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.4.4...0.5.0)

## [0.4.4](https://github.com/nasa-gibs/worldview/tree/0.4.4) (2013-06-05)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.4.3...0.4.4)

## [0.4.3](https://github.com/nasa-gibs/worldview/tree/0.4.3) (2013-05-22)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.4.2...0.4.3)

## [0.4.2](https://github.com/nasa-gibs/worldview/tree/0.4.2) (2013-04-29)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.4.1...0.4.2)

## [0.4.1](https://github.com/nasa-gibs/worldview/tree/0.4.1) (2013-04-22)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.4.0...0.4.1)

## [0.4.0](https://github.com/nasa-gibs/worldview/tree/0.4.0) (2013-04-18)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.3.1.QF1...0.4.0)

## [0.3.1.QF1](https://github.com/nasa-gibs/worldview/tree/0.3.1.QF1) (2013-02-27)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.3.1...0.3.1.QF1)

## [0.3.1](https://github.com/nasa-gibs/worldview/tree/0.3.1) (2013-02-25)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.3.0...0.3.1)

## [0.3.0](https://github.com/nasa-gibs/worldview/tree/0.3.0) (2013-02-07)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/0.3.0-RC2...0.3.0)

## [0.3.0-RC2](https://github.com/nasa-gibs/worldview/tree/0.3.0-RC2) (2013-01-14)

[Full Changelog](https://github.com/nasa-gibs/worldview/compare/546c765af4f82745d72aa25eb7a5e7172d3bc35d...0.3.0-RC2)



\* *This Changelog was automatically generated by [github_changelog_generator](https://github.com/github-changelog-generator/github-changelog-generator)*
