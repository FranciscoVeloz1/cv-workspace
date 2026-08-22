@unit
Feature: Tag name trim
  Tag names are saved trimmed.

  Scenario: Tag form submits a trimmed name
    Given the add tag dialog is open
    When I save the name "  Work  "
    Then submit should receive "Work"
