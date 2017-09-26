Feature: Natural Events
  As a user of Worldview
  I want to browse natural events
  So that I can see imagery related to events

Background:
  Given Worldview is in "initial" state
  And I click "Skip Tour"

Scenario: Selecting Events Tab

  When I click the "events" tab
  Then I should see the "list of events" within 3 seconds
  And I should see "Fire"
  And I should see "Iceberg"
  And I should see "Hurricane"
  And I should see "Volcano"
