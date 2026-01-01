# QA Report - LYHU App

**Date:** 2025-12-19
**Environment:** Localhost (Windows)
**Test Account:** `nguyenvanhuy2241988@gmail.com`

---

## 1. Login & Auth
| Feature | Status | Notes |
| :--- | :--- | :--- |
| Login Page UI | PASS | Clean interface, mock hints removed. |
| Login Logic | PASS | Successfully authenticates via Supabase. |
| Role Redirect | PASS | - Initially `/telesales` (default). <br> - After promotion: `/admin` (verified). |
| Input Handling | PASS | Fields accept clear/paste/type correctly. |

## 2. Dashboard Areas

### Telesales (`/telesales`)
- **Access**: Confirmed accessible when role is 'telesales'.
- **UI**: Components loaded (Sidebar, Stats, Lead Tables).
- **Issues**: None observed on smoke test.

### Admin (`/admin`)
- **Access**: Confirmed accessible after role update.
- **UI**: Dashboard loads.

## 3. Issues & Recommendations

### [ISSUE-1] Default Role Security
- **Description**: New users default to 'telesales'. They can potentially update their own role via API if RLS `profiles_update_own` allows modifying the `role` column.
- **Recommendation**: Restrict `role` column update in RLS policy. Only allow admins to update roles.
- **Fix**:
  ```sql
  -- Restrict profiles_update_own to only allow changing phone, address, etc. if needed.
  -- OR use a separate function for role updates.
  ```

### [ISSUE-2] Admin Promotion
- **Description**: No UI to promote users. Must use SQL.
- **Recommendation**: Create an User Management page in Admin dashboard.
