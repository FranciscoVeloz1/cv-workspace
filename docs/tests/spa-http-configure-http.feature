@unit
Feature: HTTP configuration
  Auth can wire the shared client.

  Scenario: Client exposes configureHttp for the auth provider
    Given the HTTP module
    When the auth provider configures the client
    Then later requests should use that session
