Feature: Layers
  The layers sidebar tab

Background:
  Given Worldview is in initial state
  And I click "Skip Tour"

Scenario: Getting Layer Info

  When I click the "info button"
  Then I should see the "info dialog"
  When I click the "info button"
  Then I should not see the "info dialog"
  When I click the "info button"
  Then I should see the "info dialog"

Scenario: Changing Layer Options

  When I click the "options button"
  Then I should not see the "info dialog"
  Then I should see the "options dialog"

Scenario: Adding Layers and Layer Search

  When I click "Add Layers"
  And I input "Corrected Reflectance (True Color)" in the "layers search field"
  Then I should see "Corrected Reflectance (True Color)"
  And I should see "Suomi NPP / VIIRS"
  When I click the "source info icon"
  Then I should see "VIIRS Corrected Reflectance"
  When I click the "source info icon"
  Then I should not see "VIIRS Corrected Reflectance"
  When I click the "source info icon"
  Then I should see "VIIRS Corrected Reflectance"
  When I scroll to the "source metadata close button"
  And I click the "source metadata close button"
  Then I should not see "VIIRS Corrected Reflectance"
