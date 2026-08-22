@api
Feature: Tag delete SetNull
  Deleting a tag clears the task's tag, not the task.

  Scenario: Schema setNulls task.tagId when tag is deleted
    Given a task that uses a tag
    When that tag is deleted
    Then the task should remain
    And its tagId should be null
