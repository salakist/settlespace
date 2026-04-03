# TODO

Prioritized backlog for **planned / shelved product work**.

> These items fit the current app direction, but they are not committed delivery promises.

## MVP / next up

### 1. Debts summary and settle-up flow
**Why first:** this is already scaffolded in the app and is the most natural extension of the existing transactions flow.

**Status:** route/page exists, but implementation is still pending.

**Initial scope**
- Show net balances per person
- Show who owes whom
- Summarize outstanding deficits from transactions
- Allow marking a debt as settled

**Dependencies**
- Debts API endpoints (backend)
- Debt aggregation/calculation logic
- `useDebts` hook
- Transaction API data

### 2. Dashboard / overview page
**Why next:** improves the landing experience and gives users a useful summary immediately after login.

**Initial scope**
- Recent transactions
- Outstanding balances
- Quick actions for creating persons or transactions
- At-a-glance summary cards

### 3. Reports / analytics page
**Why next:** adds insight value using existing transaction data without introducing a completely new domain.

**Initial scope**
- Monthly totals
- Category breakdowns
- Per-person spending summaries
- Trend views over time

## Later / medium-term

### 4. Groups / households page
- Organize persons into a household, trip, or other shared-expense group
- Scope transactions and debt views by group

### 5. Activity / audit history page
- Show who created, edited, deleted, or settled transactions
- Especially useful for `ADMIN` / `MANAGER` roles

### 6. Import / export tools
- Export persons or transactions to CSV/JSON
- Import migrated or seeded data

### 7. Advanced search and filtering
- Filter by date range, category, amount, or involved person
- Saved search presets for common views

## Nice-to-have / exploratory

### 8. Transaction workflow enhancements
- Statuses such as `Pending`, `Settled`, and `Disputed`
- Optional recurring transactions for rent, bills, or subscriptions

### 9. Notifications / reminders
- Remind users about unpaid balances or pending actions

### 10. Admin settings page
- Role-management utilities
- App-level maintenance and configuration actions

## Suggested delivery direction

A coherent product path for the app is:

1. `Persons`
2. `Transactions`
3. `Debts`
4. `Settlement`
5. `Reporting`

This keeps the roadmap aligned with the app’s current shared-expense and person-management model.

