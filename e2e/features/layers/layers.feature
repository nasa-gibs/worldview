Feature: Layers
  The layers sidebar tab

Background:
  Given Worldview is in "initial" state
  And I click "Skip Tour"

Scenario: Getting Layer Info

  When I click the "info button"
  Then I see the "info dialog"
  When I click the "info button"
  Then the page doesn't have the "info dialog"
  When I click the "info button"
  Then I see the "info dialog"

Scenario: Changing Layer Options

  When I click the "options button"
  Then the page doesn't have the "info dialog"
  Then I see the "options dialog"

Scenario: Adding Layers and Layer Search

  When I click "Add Layers"
  And I input "Corrected Reflectance (True Color)" in the "layers search field"
  Then I see "Corrected Reflectance (True Color)"
  And I see "Suomi NPP / VIIRS"
  When I click the "source info icon"
  Then I see "VIIRS Corrected Reflectance"
  When I click the "source info icon"
  Then I don't see "VIIRS Corrected Reflectance"
  When I click the "source info icon"
  Then I see "VIIRS Corrected Reflectance"
  When I scroll to the "source metadata close button"
  And I click the "source metadata close button"
  Then I don't see "VIIRS Corrected Reflectance"

Scenario: Browsing Layers by Category

  When I click "Add Layers"
  And I click "Aerosol Optical Depth"
  And I click the "Aqua and Terra/MODIS" link
  Then I see "MODIS (Terra and Aqua) Combined Value-Added Aerosol Optical Depth"
