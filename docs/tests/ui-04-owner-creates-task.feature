@ui
Feature: Create task
  An owner can add a card with optional tag, deadline, and checklist.

  Scenario: User A creates task Write specs
    Given I am signed in as the owner
    And I have a tag named "Work"
    When I add a task with:
      | field       | value           |
      | title       | Write specs     |
      | description | Kanban catalog  |
      | tag         | Work            |
      | deadline    | 2026-08-25      |
      | checklist   | Draft README    |
    Then the add task dialog should close
