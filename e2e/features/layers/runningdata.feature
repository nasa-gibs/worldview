Feature: Running Data
  When I hover over a data layer, I should see the values I'm hovering over displayed in the layers tab

@hover
Scenario Outline: Running data on continuous layers
  Given Worldview production has been loaded
  And Worldview is in "continuous data layers" state
  Then label says "260.9 – 261.5 K" when hovering on colorbar
  And label says "<value>" when hovering at <coordinates>

  Examples:
    | coordinates | value           |
    | 320,320     | 267.2 – 267.8 K |
    | 400,400     | 271.6 – 272.2 K |

@hover
Scenario: Running data on multiple data layers
  Given Worldview production has been loaded
  And Worldview is in "multiple data layers" state
  Then label says "0.215 – 0.220" when hovering at 320,320
  And label says "0.380 – 0.385" when hovering on colorbar
