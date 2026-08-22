@api
Feature: Delete tag via API
  Deleting a tag clears it from tasks.

  Scenario: API deletes a tag and setNulls the task tagId
    Given I own a task that uses a tag
    When I delete that tag
    Then the task should remain
    And its tag should be empty
