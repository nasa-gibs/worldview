Feature: Animation GIF Downloads
  Choose resolution of imagery and Download GIFs

Scenario: Downloading GIF when custom colormap is activated
  Given Worldview is in "animation with custom colormap active" state
  Then I see the "animation widget"
  When I click the "create GIF button"
  And I click the "GIF download icon"
  Then I see "Would you like to temporarily revert"
  When I click "OK"
  Then I see the "GIF results" within 6 seconds
  When I click the "GIF results close button"
  Then the page doesn't have the "GIF results"
  And I see the "animation widget"

Scenario: Downloading GIF when polar projection is rotated
  Given Worldview is in "animation with polar projection rotated" state
  Then I see the "animation widget"
  When I click the "create GIF button"
  And I click the "GIF download icon"
  Then I see "Would you like to reset rotation"
  When I click "OK"
  And I click the "GIF download icon"
  Then I see the "GIF results" within 6 seconds
  When I click the "GIF results close button"
  Then the page doesn't have the "GIF results"

Scenario: GIF selection preview is Accurate
  Given Worldview is in "animation widget active" state
  Then I see the "animation widget"
  When I click the "create GIF button"
  And I wait 1 seconds
  Then I see '2018-03-28' in the 'GIF preview start date value'
  Then I see '2018-04-04' in the 'GIF preview end date value'
  Then I see '3 Frames Per Second' in the 'GIF preview frame rate value'

