Feature: Animation Widget
  The widget that controls animation mode

Background:
  Given Worldview is in "initial" state
  And I click "Skip Tour"

Scenario: Toggling animation mode
  Then I don't see the "animation widget"
  When I click the "animation button"
  Then I see the "animation widget"

Scenario: Changing date range of animation
  When I click the "animation button"
  Then the animation range selector works

Scenario: Changing animation time resolution
  When I click the "animation button"
  And I scroll to the "animation resolution tooltip"
  And I click the "yearly resolution tooltip"
  And I wait 1 seconds
  Then the page has the "timeline set to years"
