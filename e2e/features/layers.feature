Feature: Layers
  The layers sidebar tab

Background:
  Given Worldview is in initial state
  And I click "Skip Tour"

Scenario: Layer Info Links

  When I click the "info button"
  Then I should see the "info dialog" element
  When I click the "info button"
  Then I should not see the "info dialog" element
  When I click the "info button"
  Then I should see the "info dialog" element

  Scenario: Layer Options Links

    When I click the "options button"
    Then I should not see the "info dialog" element
    Then I should see the "options dialog" element
