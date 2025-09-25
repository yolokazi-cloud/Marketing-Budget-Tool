# Marketing Budget AI Tool - Testing Strategy

This document outlines the testing strategy for the Marketing Budget AI Tool. The goal is to ensure the application is reliable, bug-free, and provides a good user experience. The strategy is divided into three main types of testing: Unit, Integration, and End-to-End (E2E).

## 2. Unit Testing

Unit tests focus on testing the smallest parts of the application in isolation (e.g., individual components or functions).

### Key Areas for Unit Tests:

*   **`BudgetExpensePage.js`**:
    *   Test that summary cards render and display correctly formatted totals.
    *   Test the inline editing functionality: clicking 'Edit' shows inputs, and 'Save' updates the state.
    *   Test the "Add Record" functionality.
    *   Test the client-side logic for file processing (`processUploadedData`).
*   **`BudgetOverview.js`**:
    *   Test that the main summary cards calculate and display the correct group totals.
    *   Test that the cost center charts render correctly.
    *   Test the file upload logic for updating actuals.

### Example Unit Test (`BudgetExpensePage.js`)

Here's an example of how you might test the inline editing feature using Jest and React Testing Library.

```javascript
// src/components/__tests__/BudgetExpensePage.test.js

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import BudgetExpensePage from '../BudgetExpensePage';

const mockSetBudgetData = jest.fn();
const mockBudgetData = {
  "Marketing Operations": {
    months: [
      { month: "Mar-25", actual: 45000, anticipated: 50000 },
      { month: "Apr-25", actual: 48000, anticipated: 52000 },
    ],
    categories: [
        { name: "Subscriptions", value: 35, amount: 175000 },
    ]
  }
};

describe('BudgetExpensePage', () => {
  it('should allow inline editing of a monthly record', () => {
    render(
      <BudgetExpensePage
        selectedTeam="Marketing Operations"
        budgetData={mockBudgetData}
        setBudgetData={mockSetBudgetData}
        onUpload={() => {}}
      />
    );

    // 1. Find the "Edit" button for the first record and click it
    const editButtons = screen.getAllByRole('button', { name: /edit/i });
    fireEvent.click(editButtons[0]);

    // 2. Verify that input fields appear with the correct values
    const actualInput = screen.getByDisplayValue('45000');
    const anticipatedInput = screen.getByDisplayValue('50000');
    expect(actualInput).toBeInTheDocument();
    expect(anticipatedInput).toBeInTheDocument();

    // 3. Change a value in an input
    fireEvent.change(actualInput, { target: { value: '46000' } });

    // 4. Find and click the "Save" button
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);

    // 5. Verify that the state update function was called
    expect(mockSetBudgetData).toHaveBeenCalled();
  });
});
```

## 3. Integration Testing

Integration tests check how multiple components work together.

### Key Areas for Integration Tests:

*   **`App.js`**:
    *   Test that clicking a cost center in `BudgetOverview` correctly renders the `BudgetExpensePage` with the right data.
    *   Test that state managed in `App.js` (like `budgetData`) is correctly passed as props and causes updates in child components.
    *   Test the full data flow: upload a file in `BudgetOverview`, and verify the data is updated in both `BudgetOverview` and `BudgetExpensePage`.

## 4. End-to-End (E2E) Testing

E2E tests simulate a complete user journey from start to finish. This is the highest level of testing and gives the most confidence that the application works as a whole.

### Key E2E Scenarios:

1.  **View Overview and Navigate to Details**:
    *   Load the application.
    *   Assert that the "Group Budget Overview" title and summary cards are visible.
    *   Click on the "Revenue Marketing" cost center button in the sidebar.
    *   Assert that the URL changes or the view switches.
    *   Assert that the heading "Budget Details - Revenue Marketing" is visible.
    *   Assert that the charts and tables on the page contain data specific to "Revenue Marketing".

2.  **Add and Delete a Monthly Record**:
    *   Navigate to a cost center's detail page.
    *   Click the "Add Record" button.
    *   Assert that a new editable row appears.
    *   Fill in the input fields for "Month", "Actual", and "Anticipated".
    *   Click the "Save" icon.
    *   Assert that the new record is now visible in the table as a static row.
    *   Find the "Delete" button for the newly created record and click it.
    *   Confirm the deletion in the browser's confirmation dialog.
    *   Assert that the record is removed from the table.

3.  **Upload Actuals and Verify Update**:
    *   Start on the "Group Overview" page.
    *   Locate the "Upload Actuals" button and upload a fixture file (e.g., `test-actuals.xlsx`).
    *   Assert that a success notification appears.
    *   Check that the "Total Actual" summary card on the overview page has updated to a new, expected value.
    *   Navigate to a cost center that was affected by the upload.
    *   Assert that the "Total Actual" card and the data in the "Monthly Budget Details" table on the detail page reflect the changes from the uploaded file.