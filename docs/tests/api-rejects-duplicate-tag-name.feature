@api
Feature: Duplicate tag via API
  Duplicate names conflict for the same user.

  Scenario: API rejects duplicate tag names for the same user
    Given I already created a tag named "Work"
    When I create another tag named "Work"
    Then the response status should be 409
