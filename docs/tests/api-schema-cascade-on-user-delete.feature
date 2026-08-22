@api
Feature: User delete cascade
  Removing a user removes their kanban rows.

  Scenario: Schema cascades kanban rows when the user is deleted
    Given a user with tags and tasks
    When that user is deleted
    Then those kanban rows should be gone
