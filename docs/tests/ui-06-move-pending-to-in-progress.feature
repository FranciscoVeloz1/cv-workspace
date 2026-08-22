@ui
Feature: Move to In progress
  Keyboard move persists a status change.

  Scenario: Owner moves Write specs from Pending to In progress
    Given a card titled "Write specs" is in Pending
    When I choose "Move to In progress" on that card
    Then the card should appear in In progress
