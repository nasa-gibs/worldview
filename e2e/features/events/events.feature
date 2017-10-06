Feature: Natural Events
  Users should be able to find imagery related to recent natural events via a list and markers on the map

Scenario: Selecting Events Tab
  Users should be able to see all available natural events

  Given Worldview is in "initial" state
  And I click "Skip Tour"
  And I click the "events" tab
  Then I see the "list of events" within 3 seconds
  And the page has at least 50 "map markers"

Scenario: Selecting an Event from the List
  Selecting and deselecting events should change the state of the app to display the state related to the event

  Given Worldview is in "initial" state
  And I click "Skip Tour"
  And I click the "events" tab
  Then I see the "list of events" within 3 seconds
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
  Then I don't see "Events may not be visible at all times"
  And the page has at least 4 "overlay layer items"
  Then there are 1 tabs open
  When I click the "first external event link"
  Then there are 2 tabs open
  When I close tab number 2
  Then there are 1 tabs open
  When I click the "selected first event"
  Then the page doesn't have the "selected first event"

Scenario: Permalink with events tab
  Given Worldview is in "events tab active" state
  Then I see the "list of events" within 3 seconds
  And the page has at least 50 "map markers"
