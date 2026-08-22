@unit
Feature: Task edit submit
  Save sends the edited values.

  Scenario: Form submits edit values on save
    Given the edit task dialog is open for an existing card
    When I change the fields and save
    Then submit should receive the edited values
