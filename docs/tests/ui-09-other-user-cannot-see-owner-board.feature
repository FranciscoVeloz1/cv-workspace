@ui
Feature: Board isolation
  Another authenticated user must not see the owner's cards or tags.

  Scenario: User B does not see User A's work
    Given owner A has a finished card "Write specs" tagged "Work"
    When user B signs in on a separate session
    Then user B should not see "Write specs"
    And user B should not see tag "Work"
