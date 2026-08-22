@unit
Feature: Tag name required
  An empty tag name must not submit.

  Scenario: Tag form does not submit an empty name
    Given the add tag dialog is open
    When I save with an empty name
    Then submit should not run
