@unit
Feature: Overdue deadline
  Past calendar dates are overdue.

  Scenario: Deadline before today is overdue
    Given today is a known calendar date
    When a task deadline is before today
    Then the deadline should be overdue
