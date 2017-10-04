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
  And the url has these values:
    | l | true |
    | t | true |
    | z | true |
    | v | true |
    | e | true |
  And I see "Events may not be visible at all times" within 4 seconds
  When I click "Events may not be visible at all times"
  Then I see "Why can’t I see an event?"
  When I click the "modal close button"
  And I wait 2 seconds
  Then I don't see "Why can’t I see an event?"
  When I click the "notification dismiss button"
  And I wait 2 seconds
  And I don't see "Events may not be visible at all times"
