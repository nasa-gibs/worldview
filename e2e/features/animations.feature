Feature: Animations
  Animating the map date

Background:
  Given Worldview is in "initial" state
  And I click "Skip Tour"

Scenario: Toggling animation mode
  Then I should not see the "animation widget"
  When I click the "animation button"
  Then I should see the "animation widget"

@hover
Scenario: Changing date range of animation
  When I click the "animation button"
  Then the animation range selector works

@hover
Scenario: Changing animation time resolution
  When I click the "animation button"
  And I scroll to the "animation resolution tooltip"
  And I click the "yearly resolution tooltip"
  And I wait 1 seconds
  Then the page should have the "timeline set to years"
