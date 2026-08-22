@unit
Feature: Missing deadline
  No deadline means not overdue.

  Scenario: Missing deadline is not overdue
    Given a task with no deadline
    When I evaluate overdue
    Then the deadline should not be overdue
