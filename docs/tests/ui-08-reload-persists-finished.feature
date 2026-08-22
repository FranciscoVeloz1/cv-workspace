@ui
Feature: Reload persistence
  Column placement must survive a browser reload.

  Scenario: Finished card remains after reload
    Given a card titled "Write specs" is in Finished
    When I reload the board
    Then I should still see "Write specs" in Finished
