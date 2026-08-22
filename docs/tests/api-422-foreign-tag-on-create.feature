@api
Feature: Foreign tag on create
  Creating with another user's tagId is a validation error.

  Scenario: API rejects user B creating a task with user A tagId as 422
    Given user A owns a tag
    And I am authenticated as user B
    When I create a task using user A's tagId
    Then the response status should be 422
