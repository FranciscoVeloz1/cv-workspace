@unit
Feature: Column drop
  Dropping a card on a column requests that status.

  Scenario: Dropping a card on Finished calls onMove with FINISHED
    Given a card is being dragged
    When I drop it on the Finished column
    Then onMove should be called with FINISHED
