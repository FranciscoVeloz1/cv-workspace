@ui
Feature: Owner sign in
  Provisioned users can open their own board.

  Scenario: User A signs in
    Given a provisioned owner "kanban.a@example.com"
    And I am on the login screen
    When I sign in with email "kanban.a@example.com" and password "KanbanTest1!"
    Then I should see the Pending column
