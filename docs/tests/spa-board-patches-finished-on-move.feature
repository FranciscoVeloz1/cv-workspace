@unit
Feature: Optimistic move
  Moving a pending card patches FINISHED.

  Scenario: Hook patches FINISHED when moving a pending task
    Given a pending task on the board
    When I move it to Finished
    Then the client should PATCH status FINISHED
