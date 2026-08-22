@unit
Feature: Task card contents
  A card shows title, tag, overdue deadline, checklist progress, and move actions.

  Scenario: Card shows title, tag, overdue deadline, checklist progress, and keyboard moves
    Given a pending task with a tag, overdue deadline, and checklist
    When I render the card
    Then I should see the title and tag
    And I should see overdue deadline treatment
    And I should see checklist progress
    And I should see keyboard moves to other columns
