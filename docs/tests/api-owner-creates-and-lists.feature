@api
Feature: Owner CRUD list
  An owner can create a tag and task and see them.

  Scenario: API lets user A create a tag and task and list them
    Given I am authenticated as user A
    When I create a tag
    And I create a task
    And I list tags and tasks
    Then I should see the tag and task I created
