# TODO

Prioritized backlog for **planned / shelved product work**.

> These items fit the current app direction, but they are not committed delivery promises.
> The debts summary and settle-up flow are now part of the implemented MVP and are no longer pending.

## MVP / next up

### 0. Technical debt 
**Why next:** improves the landing experience and gives users a useful summary immediately after login.

**Initial scope**

- run full code sonar analysis and fix all passing issues

### 1. Dashboard / overview page
**Why next:** improves the landing experience and gives users a useful summary immediately after login.

**Initial scope**
- Recent transactions
- Outstanding balances
- Quick actions for creating persons or transactions
- At-a-glance summary cards

### 2. Reports / analytics page
**Why next:** adds insight value using existing transaction data without introducing a completely new domain.

**Initial scope**
- Monthly totals
- Category breakdowns
- Per-person spending summaries
- Trend views over time

## Later / medium-term

### 3. Groups / households page
- Organize persons into a household, trip, or other shared-expense group
- Scope transactions and debt views by group

### 4. Activity / audit history page
- Show who created, edited, deleted, or settled transactions
- Especially useful for `ADMIN` / `MANAGER` roles

### 5. Import / export tools
- Export persons or transactions to CSV/JSON
- Import migrated or seeded data

### 6. Advanced search and filtering
- Filter by date range, category, amount, or involved person
- Saved search presets for common views

## Nice-to-have / exploratory

### 7. Transaction workflow enhancements
- Statuses such as `Pending`, `Settled`, and `Disputed`
- Optional recurring transactions for rent, bills, or subscriptions

### 8. Notifications / reminders
- Remind users about unpaid balances or pending actions

### 9. Admin settings page
- Role-management utilities
- App-level maintenance and configuration actions

## Suggested delivery direction

With `Persons`, `Transactions`, and the `Debts` / settlement MVP now in place, the next coherent product path is:

1. `Dashboard`
2. `Reporting`
3. `Groups`
4. `Activity`
5. `Import / Export`

This keeps the roadmap aligned with the app’s current shared-expense model while reflecting the work already delivered.

