@unit
Feature: Confirm delete
  Confirming runs the destructive action.

  Scenario: Confirm dialog calls onConfirm when Delete is clicked
    Given a confirm delete dialog is open
    When I choose Delete
    Then onConfirm should run
