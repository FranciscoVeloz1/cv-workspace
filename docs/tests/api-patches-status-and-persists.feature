@api
Feature: Status patch
  PATCH status is visible on the next GET.

  Scenario: API patches task status and persists it on GET
    Given I own a pending task
    When I PATCH its status to FINISHED
    And I GET the task
    Then the status should be FINISHED
