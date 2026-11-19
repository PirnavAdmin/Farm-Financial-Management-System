# Module 1 Backend Documentation — Auth, Users, Roles, Permissions, Company & Audit Logs

**Project:** AGRIMAN Unified Farm Financial & Operations Platform (`backend/AgriMan.Unified.Api`)  
**Framework:** ASP.NET Core 8 Web API + Entity Framework Core (`Pomelo.EntityFrameworkCore.MySql`)  
**Database:** MySQL (`agriman_db`)  
**Swagger Group:** `1. Auth & User API Only` (`/swagger`)

---

## 1. Module 1 Backend Completion Breakdown

### A. Previously Completed (Before This Update)
- Basic JWT authentication (`POST /api/auth/login`, `POST /api/auth/register`) with `TokenService` and `PasswordHasher` (BCrypt)
- Password reset flow (`POST /api/auth/forgot-password`, `POST /api/auth/verify-otp`, `POST /api/auth/reset-password`) and SMTP HTML template in `EmailService`
- Basic login history logging (`GET /api/auth/login-history`)
- Basic user CRUD (`GET /api/users`, `GET /api/users/stats`, `GET /api/users/{id}`, `POST /api/users`, `PUT /api/users/{id}`, `DELETE /api/users/{id}`)
- Read-only `GET /api/roles` and `GET /api/permissions`
- 8 EF Core entities in `ApplicationDbContext`: `users`, `roles`, `permissions`, `user_roles`, `role_permissions`, `user_permissions`, `login_history`, `password_resets`
- Initial database seeder (`DbInitializer`) for 3 roles, 7 permissions, and default admin (`USR-001`)

### B. Completed Now (Remaining Module 1 Backend Work)
1. **Authentication & Session Security (`AuthController`)**
   - Added `POST /api/v1/auth/refresh-token` (refresh token rotation stored in `refresh_tokens`)
   - Added `POST /api/v1/auth/logout` (revokes refresh tokens + audit logs logout)
   - Added `GET /api/v1/auth/me` (returns authenticated user profile, roles, and merged role + direct permissions)
   - Added `POST /api/v1/auth/change-password` (authenticated password update + revokes existing refresh tokens)
   - Added `/verify-reset-otp` route alias alongside `/verify-otp` to match frontend `auth.js`
   - Added DTO field aliases (`FullName`/`Name`, `PhoneNumber`/`MobileNumber`, optional `ConfirmPassword`, `AccessToken`/`Token`, `RefreshToken`, `Role`/`PrimaryRole`) for full frontend & Swagger compatibility
   - Restricted raw OTP exposure in `/forgot-password` responses to Development mode (or `Auth:ExposeOtpInResponse = true`)
   - Removed insecure plaintext password fallback in `PasswordHasher.cs` (strict BCrypt verification only)
   - Fixed self-registration default role assignment so unknown roles fall back to `Viewer` instead of `Administrator`

2. **Full User Administration (`UsersController`)**
   - Enforced `[Authorize]` across all user administration endpoints
   - Added `PATCH /api/v1/users/{id}/status` (activate/deactivate user + revokes refresh tokens on deactivation)
   - Added `GET /api/v1/users/{id}/permissions` and `PUT /api/v1/users/{id}/permissions`
   - Added `PUT /api/v1/users/{id}/roles`
   - Added `GET /api/v1/users/{id}/login-history`
   - Added `POST /api/v1/users/{id}/photo` (multipart upload or base64 JSON) and `DELETE /api/v1/users/{id}/photo`
   - Updated `POST /api/v1/users` and `PUT /api/v1/users/{id}` to accept `RoleId`, `Role`, `Roles[]`, `IsActive`, and `Permissions[]`
   - Updated user list & detail responses to include `roles`, `permissions`, `isActive`, `totalPages`, and `items`

3. **Full Roles & Permissions Management (`RolesController` & `PermissionsController`)**
   - Enforced `[Authorize]`
   - Added `GET /api/v1/roles/{id}`, `POST /api/v1/roles`, `PUT /api/v1/roles/{id}`, `DELETE /api/v1/roles/{id}` (blocks deletion if users are assigned), and `PUT /api/v1/roles/{id}/permissions`
   - Enhanced `GET /api/v1/permissions` with `?grouped=true` support and added `POST /api/v1/permissions`

4. **Company Settings, Audit Logs & Login History (`CompanyController`, `AuditLogsController`, `LoginHistoryController`)**
   - Added `CompanyController` (`GET /api/v1/company`, `PUT /api/v1/company`) backed by `company_settings`
   - Added `AuditLogsController` (`GET /api/v1/audit-logs`, `GET /api/v1/audit-logs/export/csv`) backed by `audit_logs`
   - Added `LoginHistoryController` (`GET /api/v1/login-history`) with pagination, status, userId, and search filters
   - Added `IAuditService` / `AuditService` to record administrative mutations (`REGISTER`, `LOGOUT`, `CHANGE_PASSWORD`, `RESET_PASSWORD`, `CREATE`, `UPDATE`, `ACTIVATE`, `DEACTIVATE`, `DELETE`, `ASSIGN_ROLES`, `ASSIGN_PERMISSIONS`, `UPDATE_PHOTO`, `DELETE_PHOTO`)

5. **Database & Seeder Alignment**
   - Added EF Core models & mappings for `RefreshToken` (`refresh_tokens`), `AuditLog` (`audit_logs`), and `CompanySetting` (`company_settings`)
   - Added automatic startup MySQL schema bootstrapping in `DbInitializer.EnsureModule1SchemaAsync` (`CREATE TABLE IF NOT EXISTS` for all 11 Module 1 tables + automatic `login_history` column alignment) so running the API immediately initializes the database
   - Expanded `DbInitializer` to idempotently seed 6 default roles, 19 module permissions, Administrator role-permission mappings, and default `company_settings`
   - Synchronized `database/setup_agriman_mysql.sql` and `database/sync_all_tables_mysql.sql` with `password_resets`, `refresh_tokens`, `audit_logs`, `company_settings`, and `login_history` (`Identifier`, `RememberMe`)

---

## 2. Architecture & File Map

| Layer | Files |
| :--- | :--- |
| **Controllers** | `Controllers/Auth/AuthController.cs`<br>`Controllers/Auth/UsersController.cs`<br>`Controllers/Auth/RolesController.cs` (`RolesController`, `PermissionsController`)<br>`Controllers/Auth/CompanyController.cs`<br>`Controllers/Auth/AuditLogsController.cs`<br>`Controllers/Auth/LoginHistoryController.cs` |
| **Models** | `Models/Auth/User.cs`, `Role.cs`, `Permission.cs`, `UserRole.cs`, `RolePermission.cs`, `UserPermission.cs`, `LoginHistory.cs`, `PasswordReset.cs`, `RefreshToken.cs`, `AuditLog.cs`, `CompanySetting.cs` |
| **DTOs** | `DTOs/Auth/AuthDtos.cs`, `UserDtos.cs`, `RoleDtos.cs`, `CompanyDtos.cs`, `AuditLogDtos.cs` |
| **Services** | `Services/PasswordHasher.cs`, `TokenService.cs`, `EmailService.cs`, `IEmailService.cs`, `IAuditService.cs`, `AuditService.cs` |
| **Data** | `Data/Auth/ApplicationDbContext.cs`, `Data/Auth/DbInitializer.cs` |
| **Database Scripts** | `database/setup_agriman_mysql.sql`, `database/sync_all_tables_mysql.sql` |

---

## 3. REST API Endpoint Reference

All routes support both `/api/...` and `/api/v1/...`. Protected routes require `Authorization: Bearer <jwt>`.

### 3.1 Authentication (`/api/v1/auth`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/register` | Public | Register user (`name`/`fullName`, `email`, `mobileNumber`/`phoneNumber`, `password`, optional `confirmPassword`, `role`). Returns JWT + refresh token. |
| `POST` | `/api/v1/auth/login` | Public | Login with email or mobile + password + `rememberMe`. Logs attempt to `login_history` and returns JWT + refresh token + user profile. |
| `POST` | `/api/v1/auth/refresh-token` | Public | Rotate refresh token and issue a new JWT access token. |
| `POST` | `/api/v1/auth/logout` | Bearer | Revoke provided refresh token (or all active refresh tokens for the user). |
| `GET` | `/api/v1/auth/me` | Bearer | Get current authenticated user profile, roles, and effective permissions. |
| `POST` | `/api/v1/auth/change-password` | Bearer | Change password for signed-in user and revoke old refresh tokens. |
| `POST` | `/api/v1/auth/forgot-password` | Public | Generate 6-digit OTP (15 min expiry), store in `password_resets`, and dispatch via SMTP. |
| `POST` | `/api/v1/auth/verify-otp` | Public | Verify 6-digit OTP and issue `resetToken`. |
| `POST` | `/api/v1/auth/verify-reset-otp` | Public | Route alias for `/verify-otp`. |
| `POST` | `/api/v1/auth/reset-password` | Public | Reset password via `resetToken` or `otp` and revoke active refresh tokens. |
| `GET` | `/api/v1/auth/login-history` | Bearer | View recent login attempts (`?limit=50`). |

### 3.2 User Administration (`/api/v1/users`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users` | Bearer | Paginated user list with `search`, `role`, `status`, `page`, `pageSize`, plus KPI `stats`. |
| `GET` | `/api/v1/users/stats` | Bearer | Total, Active, and Inactive user counts. |
| `GET` | `/api/v1/users/{id}` | Bearer | User details including roles and effective permissions. |
| `POST` | `/api/v1/users` | Bearer | Create user (auto-generates `USR-xxx`; supports `roleId` or `roles[]`, `permissions[]`, `isActive`). |
| `PUT` | `/api/v1/users/{id}` | Bearer | Update user profile, status, roles, and direct permissions. |
| `PATCH` | `/api/v1/users/{id}/status` | Bearer | Toggle user active/inactive status (`{ "isActive": true/false }`). |
| `DELETE` | `/api/v1/users/{id}` | Bearer | Soft-delete user and revoke active refresh tokens. |
| `GET` | `/api/v1/users/{id}/permissions` | Bearer | Get direct, role-inherited, and effective permissions for a user. |
| `PUT` | `/api/v1/users/{id}/permissions` | Bearer | Replace direct permissions (`permissionIds` or `permissions` names). |
| `PUT` | `/api/v1/users/{id}/roles` | Bearer | Replace user roles (`roleIds` or `roles` names). |
| `GET` | `/api/v1/users/{id}/login-history` | Bearer | Paginated login history for a specific user. |
| `POST` | `/api/v1/users/{id}/photo` | Bearer | Upload user profile photo (`multipart/form-data` or JSON base64). |
| `DELETE` | `/api/v1/users/{id}/photo` | Bearer | Remove user profile photo. |

### 3.3 Roles & Permissions (`/api/v1/roles`, `/api/v1/permissions`)
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/roles` | Bearer | List all roles with user count and assigned permissions. |
| `GET` | `/api/v1/roles/{id}` | Bearer | Get single role details and assigned permissions. |
| `POST` | `/api/v1/roles` | Bearer | Create a new role with optional permissions. |
| `PUT` | `/api/v1/roles/{id}` | Bearer | Update role name, description, and optional permissions. |
| `DELETE` | `/api/v1/roles/{id}` | Bearer | Delete role (only when `userCount == 0`). |
| `PUT` | `/api/v1/roles/{id}/permissions` | Bearer | Replace permissions assigned to a role. |
| `GET` | `/api/v1/permissions` | Bearer | List all system permissions (add `?grouped=true` to group by module). |
| `POST` | `/api/v1/permissions` | Bearer | Create a new custom permission. |

### 3.4 Company Settings, Audit Logs & Login History
| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/company` | Bearer | Retrieve organization profile and company settings. |
| `PUT` | `/api/v1/company` | Bearer | Update organization profile and company settings. |
| `GET` | `/api/v1/audit-logs` | Bearer | Paginated audit trail (`entityType`, `action`, `actorUserId`, `search`, `fromDate`, `toDate`, `page`, `pageSize`). |
| `GET` | `/api/v1/audit-logs/export/csv` | Bearer | Download filtered audit trail as CSV. |
| `GET` | `/api/v1/login-history` | Bearer | Paginated system login history (`userId`, `status`, `search`, `page`, `pageSize`). |

---

## 4. Database Tables (Module 1 in `agriman_db`)

1. `users`
2. `roles`
3. `permissions`
4. `user_roles`
5. `role_permissions`
6. `user_permissions`
7. `login_history` (updated with `Identifier` & `RememberMe`)
8. `password_resets`
9. `refresh_tokens`
10. `audit_logs`
11. `company_settings`

To apply schema updates to an existing MySQL `agriman_db` database, execute:
- `database/sync_all_tables_mysql.sql` (non-destructive, idempotent alignment for existing databases), or
- `database/setup_agriman_mysql.sql` (clean fresh setup).

---

## 5. Configuration Checklist for Production

1. **SMTP Password**: Set `SmtpSettings:Password` in `appsettings.json` (or via environment variable `SmtpSettings__Password` / `dotnet user-secrets`) using a Gmail App Password so Forgot Password emails deliver to real inboxes.
2. **JWT Secret**: Replace the default `Jwt:Key` in `appsettings.json` with a secure secret managed via environment variables before deploying to production.
