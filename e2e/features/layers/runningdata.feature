Feature: Running Data
  When I hover over a data layer, I should see the values I'm hovering over displayed in the layers tab

@wip
Scenario: Running data on continuous layers
  Given Worldview is in "continuous data layers" state
  Then label says "270.9 – 271.6 K" when mouse is in the center
  And label says "260.9 – 261.5 K" when hovering on colorbar

@wip
Scenario: Running data on multiple data layers
  Given Worldview is in "multiple data layers" state
  Then label says "0.070 – 0.075" when mouse is in the center
  And label says "0.380 – 0.385" when hovering on colorbar
