@api
Feature: Unique tag name
  A user cannot own two tags with the same name.

  Scenario: Schema rejects duplicate tag names for the same user
    Given a user already has a tag named "Work"
    When I insert another tag named "Work" for that user
    Then the insert should be rejected
