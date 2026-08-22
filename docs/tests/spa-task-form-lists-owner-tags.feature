@unit
Feature: Task tag select
  The form lists the owner's tags.

  Scenario: Form lists owner tags in the select
    Given the add task dialog is open
    And the owner has tags
    When I look at the tag field
    Then I should see those tags as options
