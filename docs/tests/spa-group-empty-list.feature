@unit
Feature: Empty board grouping
  An empty task list still has three columns.

  Scenario: Grouping an empty list returns three empty arrays
    Given there are no tasks
    When I group tasks by column
    Then Pending, In progress, and Finished should each be empty
