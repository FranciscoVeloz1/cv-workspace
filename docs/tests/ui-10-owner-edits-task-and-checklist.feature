@ui
Feature: Edit task
  Opening a card lets the owner change title and checklist.

  Scenario: Owner renames Write specs and marks a checklist item done
    Given a card titled "Write specs" is on the board
    When I open the card
    And I change the title to "Write specs v2"
    And I mark the first checklist item done
    And I save
    Then I should see a card titled "Write specs v2"
