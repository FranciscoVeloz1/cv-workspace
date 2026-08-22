@ui
Feature: New card in Pending
  A newly created task starts in Pending.

  Scenario: Write specs appears in Pending with its tag
    Given I created a task titled "Write specs" with tag "Work"
    When I look at the Pending column
    Then I should see a card titled "Write specs"
    And the card should show tag "Work"
