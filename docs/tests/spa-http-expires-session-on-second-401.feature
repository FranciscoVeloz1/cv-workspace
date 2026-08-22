@unit
Feature: HTTP session expiry
  A failed refresh retry must end the session.

  Scenario: Client expires the session when the retry still returns 401
    Given an HTTP client with a stored access token
    And every request returns 401
    When I request a kanban resource
    Then the session expired handler should run
