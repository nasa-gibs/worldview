Feature: Animation GIF Downloads
  Download GIFs

Scenario: Downloading GIF when custom colormap is activated
  Given Worldview is in "custom colormap active" state
  Then I should see the "animation widget"
  When I click the "create GIF button"
  And I click the "GIF download icon"
  Then I should see "Would you like to temporarily revert"
  When I click "OK"
  Then I should see the "GIF results" within 6 seconds
  When I click the "GIF results close button"
  Then the page should not have the "GIF results"
  And I should see the "animation widget"
