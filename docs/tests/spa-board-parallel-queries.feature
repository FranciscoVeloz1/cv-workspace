@unit
Feature: Board data loading
  Tasks and tags must load independently.

  Scenario: Board starts tasks and tags queries without waiting on each other
    Given I am on the board
    When the board hook mounts
    Then the tasks query and the tags query should start together
