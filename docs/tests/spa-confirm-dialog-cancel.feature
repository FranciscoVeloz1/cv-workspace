@unit
Feature: Cancel delete
  Cancel leaves the record in place.

  Scenario: Confirm dialog does not confirm when Cancel is clicked
    Given a confirm delete dialog is open
    When I choose Cancel
    Then onConfirm should not run
