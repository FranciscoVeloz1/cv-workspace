@unit
Feature: Deadline due today
  Today is not overdue.

  Scenario: Deadline today is not overdue
    Given today is a known calendar date
    When a task deadline is today
    Then the deadline should not be overdue
