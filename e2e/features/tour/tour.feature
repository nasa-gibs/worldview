Feature: Tour
  As a user of Worldview
  I want to take a tour of the app
  So that I can learn how to use Worldview

Background:
  Given Worldview is in "initial" state
  Then I see "Take Tour"

  Scenario: Skipping Tour
    When I click "Skip Tour"
    Then I don't see "Take Tour"
