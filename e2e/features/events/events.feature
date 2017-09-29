Feature: Natural Events
  Users should be able to find imagery related to recent natural events via a list and markers on the map

Background:
  Given Worldview is in "initial" state
  And I click "Skip Tour"
  And I click the "events" tab
  Then I see the "list of events" within 3 seconds

Scenario: Selecting Events Tab
  Users should be able to see all available natural events

  Given I see "Fire"
  And I see "Iceberg"
  And I see "Hurricane"
  And I see "Volcano"
  And I see 50+ markers on the map

Scenario: Selecting an Event from the List

  When I click the "first event"
  Then I see the "selected marker"
  And I see the "selected first event"
