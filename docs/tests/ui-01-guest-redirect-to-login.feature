@ui
Feature: Guest redirect
  Unauthenticated visitors must not see the board.

  Scenario: Guest visiting home is sent to login
    Given I am not signed in
    When I open the board at "/"
    Then I should be on the login screen
