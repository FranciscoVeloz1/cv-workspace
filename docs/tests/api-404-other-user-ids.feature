@api
Feature: Foreign ids look missing
  Another user's ids must 404.

  Scenario: API returns 404 when user B uses user A task ids
    Given user A owns a task
    And I am authenticated as user B
    When I access user A's task id
    Then the response status should be 404
