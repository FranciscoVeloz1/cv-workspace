@api
Feature: Task title validation
  Creating a task without a title is rejected.

  Scenario: API rejects POST task without title with 422
    Given I am authenticated
    When I POST /api/v1/kanban/tasks without a title
    Then the response status should be 422
