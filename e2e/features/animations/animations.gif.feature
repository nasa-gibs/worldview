Feature: Animation GIF Downloads
  Download GIFs

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
