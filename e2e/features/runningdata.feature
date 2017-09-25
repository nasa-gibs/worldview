Feature: Running Data
  When I hover over a data layer, I should see the values I'm hovering over displayed in the layers tab

Scenario: Running data on continuous layers
  Given Worldview production has been loaded
  And Worldview is in "continuous data layers" state
  Then label should say "267.2 – 267.8 K" when hovering at 320,320
  And label should say "260.9 – 261.5 K" when hovering on colorbar

Scenario: Running data on multiple data layers
  Given Worldview production has been loaded
  And Worldview is in "multiple data layers" state
  Then label should say "0.215 – 0.220" when hovering at 320,320
  And label should say "0.380 – 0.385" when hovering on colorbar
