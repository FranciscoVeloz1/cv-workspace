@unit
Feature: Future deadline
  Future dates are not overdue.

  Scenario: Deadline after today is not overdue
    Given today is a known calendar date
    When a task deadline is after today
    Then the deadline should not be overdue
