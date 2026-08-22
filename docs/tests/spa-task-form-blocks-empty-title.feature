@unit
Feature: Task title required
  Create must not submit without a title.

  Scenario: Form does not submit create when title is empty
    Given the add task dialog is open
    When I save with an empty title
    Then submit should not run
