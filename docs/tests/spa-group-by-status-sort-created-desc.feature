@unit
Feature: Column grouping
  Cards group by status and newest first.

  Scenario: Tasks group by status and sort by createdAt descending
    Given tasks in mixed statuses
    When I group tasks by column
    Then each column should contain only its status
    And cards in a column should be ordered by createdAt descending
