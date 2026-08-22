@api
Feature: Auth required
  Kanban list endpoints require a session.

  Scenario: API rejects unauthenticated GET /api/v1/kanban/tasks with 401
    Given I am not authenticated
    When I GET /api/v1/kanban/tasks
    Then the response status should be 401
