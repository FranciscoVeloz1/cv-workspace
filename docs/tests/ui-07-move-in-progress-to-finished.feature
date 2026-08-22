@ui
Feature: Move to Finished
  Keyboard move can finish a card.

  Scenario: Owner moves Write specs from In progress to Finished
    Given a card titled "Write specs" is in In progress
    When I choose "Move to Finished" on that card
    Then the card should appear in Finished
