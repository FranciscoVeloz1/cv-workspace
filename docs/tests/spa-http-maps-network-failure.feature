@unit
Feature: HTTP connection error
  Network failures are mapped to a connection error.

  Scenario: Client maps a network failure to a connection error
    Given an HTTP client
    And fetch rejects with a network error
    When I request a kanban resource
    Then I should receive a connection error
