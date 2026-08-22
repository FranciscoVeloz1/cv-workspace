@unit
Feature: HTTP 401 retry
  A single expired access token should refresh and retry.

  Scenario: Client retries a 401 exactly once after refresh
    Given an HTTP client with a stored access token
    And the first request returns 401
    And refresh succeeds
    When I request a kanban resource
    Then refresh should run once
    And the request should succeed on retry
