@ui
Feature: Create tag
  An owner can add a personal tag from the board.

  Scenario: User A creates tag Work
    Given I am signed in as the owner
    When I add a tag named "Work"
    Then the add tag dialog should close
