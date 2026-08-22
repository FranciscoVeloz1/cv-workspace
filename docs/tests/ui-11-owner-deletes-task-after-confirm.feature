@ui
Feature: Delete task
  Delete requires confirmation.

  Scenario: Owner deletes Write specs v2 after confirm
    Given a card titled "Write specs v2" is on the board
    When I open the card
    And I choose delete
    And I confirm the delete
    Then I should not see "Write specs v2"
