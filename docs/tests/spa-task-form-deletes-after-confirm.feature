@unit
Feature: Task delete confirm
  Delete from the form waits for confirm.

  Scenario: Form deletes only after confirm
    Given the edit task dialog is open
    When I choose delete
    Then delete should not run yet
    When I confirm
    Then delete should run
