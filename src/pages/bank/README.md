# Bank Module Documentation

This directory contains the pages and components related to Bank management in the ERP system. It handles listing bank transactions, uploading bank statements, matching UPI transactions, and editing bank entries (classifying them as Cheque, NEFT, etc.).

## Directory Structure

```
src/pages/bank/
├── components/                 # Sub-components specific to Bank pages
│   ├── bank-collection-list.tsx # Displays read-only list of pushed collections
│   └── cheque-details-section.tsx # Form section for Cheque details
├── edit.tsx                    # Edit page wrapper
├── form.tsx                    # Main Bank Entry Form component
├── index.ts                    # Exports
├── list.tsx                    # List page with filters and actions
└── types.ts                    # TypeScript interfaces
```

## Key Components

### 1. BankList (`list.tsx`)
The main entry point for viewing bank transactions.
-   **Features**:
    -   Displays a data table of bank entries.
    -   **Filters**: Date, Collection Type, Bank, Pushed Status.
    -   **Actions**:
        -   `MatchUpiButton`: Triggers a backend job to match UPI transactions.
        -   `UploadStatementDialog`: Allows uploading an Excel file for bank statement import.
        -   `EditButton`: Navigates to the edit page for a transaction.
-   **State**: Manages filters locally and syncs with Refine's `useTable`.

### 2. BankForm (`form.tsx`)
The core form for editing a bank transaction. It handles complex logic based on the transaction `type` and `pushed` status.
-   **Props**: `footer` (ReactNode) - usually the save buttons.
-   **Logic**:
    -   **Read-Only Fields**: Date, Amount, Reference, Description are generally read-only as they come from the bank statement.
    -   **Type Selection**: User selects the type (Cheque, NEFT, UPI, etc.).
    -   **Conditional Rendering**:
        -   **Cheque**: Shows `ChequeDetailsSection`.
        -   **NEFT**: Shows `CollectionEntries` (via `BankCollectionList` logic).
        -   **Pushed Status**:
            -   If `pushed` is true, the form is largely read-only.
            -   If `pushed` is true and collections exist, it renders `BankCollectionList` (read-only view).
            -   If `pushed` is false and type is NEFT, it renders `CollectionEntries` (editable form).
-   **Validation**:
    -   Validates total collection amount against the transaction amount.
    -   Validates cheque number and status if type is Cheque.

### 3. BankCollectionList (`components/bank-collection-list.tsx`)
A component responsible for fetching and displaying the list of collections associated with a bank entry.
-   **Props**: `bankId`.
-   **Behavior**:
    -   Fetches data from `/bank_collection/${bankId}/`.
    -   Renders a list of bills and amounts.
    -   Shows "Pushed" or "Not Pushed" status for each item.
    -   Returns `null` if no collections are found (after loading).

### 4. ChequeDetailsSection (`components/cheque-details-section.tsx`)
A form section specific to Cheque transactions.
-   **Props**: `isDisabled`, `bankId`.
-   **Behavior**:
    -   Fetches available cheque options from `/cheque_options/${bankId}/` (if applicable).
    -   Provides fields for Cheque Number and Cheque Status.
    -   Uses `useFormContext` to access the parent form's control.

## Data Flow & Logic

1.  **Statement Upload**: User uploads an Excel file via `UploadStatementDialog`. Backend processes this and creates `Bank` records.
2.  **Listing**: User views these records in `BankList`.
3.  **Editing/Classification**: User clicks "Edit" on a record.
    -   **Scenario A: NEFT**: User selects "NEFT", selects a Party, and adds "Collection Entries" (allocating the amount to specific bills).
    -   **Scenario B: Cheque**: User selects "Cheque", fills in Cheque No and Status.
4.  **Pushing**: When the form is saved/processed (logic handled by backend/Refine `onFinish`), the `pushed` flag may be set to true.
5.  **Read-Only View**: If a record is `pushed`, `BankForm` renders the `BankCollectionList` instead of the editable `CollectionEntries`, preventing further modification of the allocation.

## Types (`types.ts`)

-   **`Bank`**: Represents the main bank transaction record.
    -   `id`, `date`, `ref`, `desc`, `amt`, `bank`
    -   `pushed`: boolean - determines if the record is locked/processed.
    -   `type`: string - classification (neft, cheque, etc.).
    -   `collection`: Array of `BankCollection` items (for payload).
-   **`BankCollection`**: Represents a single allocation to a bill.
    -   `bill`, `amt`, `party`, `balance`.

## Shared Components Used
-   `CurrencyInput`: For formatting amounts.
-   `CollectionEntries`: Reusable component for managing bill allocations (also used in Cheque module).
-   `ResourceCombobox`: For selecting Party/Resources.
