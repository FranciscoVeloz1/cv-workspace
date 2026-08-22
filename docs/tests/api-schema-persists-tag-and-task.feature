@api
Feature: Persist tag and task
  Prisma stores an owned tag and task.

  Scenario: Schema persists a tag and task for a user
    Given an authenticated user
    When I insert a tag and a task for that user
    Then both rows should exist for that user
