@unit
Feature: Move rollback
  A failed status patch must restore the previous column.

  Scenario: Hook reverts the card when the status patch fails
    Given a pending task on the board
    And the status patch will fail
    When I move the task
    Then the card should return to Pending
