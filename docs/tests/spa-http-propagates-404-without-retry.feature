@unit
Feature: HTTP 404 passthrough
  Missing resources must not trigger refresh.

  Scenario: Client propagates 404 without retry
    Given an HTTP client with a stored access token
    And the request returns 404
    When I request a missing kanban resource
    Then refresh should not run
    And the client should surface the 404
