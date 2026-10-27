# AGRIMAN Farm Management System - Settings: Users & Backend APIs

An enterprise-grade ASP.NET Core 8 Web API connected to Microsoft SQL Server (`Niranjan\SQLEXPRESS`), providing complete backend services for the **Settings → Users** module, **Roles & Permissions**, **Company Settings**, **Audit Logs & Login History**, and integrated **Authentication**.

---

## 1. Project Architecture & Structure

```
AdminPage/
├── Controllers/
│   ├── UsersController.cs        # User CRUD, pagination, filtering, stats, permissions, login-history
│   ├── RolesController.cs        # Role management & permission assignments
│   ├── AuditLogsController.cs    # Security audits and system login activity
│   ├── CompanyController.cs      # Organization profile & farm configuration
│   └── AuthController.cs         # Login, JWT issuing, Refresh tokens, Password Reset
├── Models/
│   ├── User.cs                   # User entity with UserCode, MobileNumber, PasswordHash, IsActive
│   ├── Role.cs                   # Roles (Administrator, Manager, Accountant, etc.)
│   ├── Permission.cs             # Granular permissions (users.view, finance.manage, etc.)
│   ├── UserRole.cs               # Many-to-many user <-> role join
│   ├── RolePermission.cs         # Many-to-many role <-> permission join
│   ├── UserPermission.cs         # User direct permission overrides
│   ├── LoginHistory.cs           # Tracks login attempts, IP, status, user agent
│   ├── AuditLog.cs               # Tracks actions (CREATE, UPDATE, DEACTIVATE, ASSIGN_ROLES)
│   ├── CompanySetting.cs         # Organization profile settings
│   └── RefreshToken.cs           # JWT Refresh token rotation
├── DTOs/
│   ├── CreateUserRequest.cs
│   ├── UpdateUserRequest.cs
│   ├── UserResponse.cs
│   ├── UserStatsResponse.cs
│   ├── UpdateUserStatusRequest.cs
│   ├── AssignRolesRequest.cs
│   ├── PaginatedResponse.cs
│   ├── RoleDtos.cs
│   ├── AuditLogDtos.cs
│   ├── CompanyDtos.cs
│   └── AuthDtos.cs
├── Services/
│   ├── IUserService.cs & UserService.cs
│   ├── IRoleService.cs & RoleService.cs
│   ├── IAuditService.cs & AuditService.cs
│   ├── ICompanyService.cs & CompanyService.cs
│   ├── IPasswordHasher.cs & PasswordHasher.cs (BCrypt)
│   └── ITokenService.cs & TokenService.cs (JWT Bearer)
├── Repositories/
│   ├── IUserRepository.cs & UserRepository.cs
│   └── IRoleRepository.cs & RoleRepository.cs
├── Data/
│   ├── ApplicationDbContext.cs
│   └── DbInitializer.cs          # Auto-creates tables and seeds demo users from screenshot
├── Middleware/
│   └── ExceptionHandlingMiddleware.cs
├── wwwroot/
│   └── index.html                # Exact UI matching the AGRIMAN Settings -> Users screen
├── appsettings.json
├── Program.cs
└── AgriMan.Api.csproj
```

---

## 2. SQL Server Database Configuration

The application is connected to **`admindb`** on the **`Niranjan\SQLEXPRESS`** instance.

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=Niranjan\\SQLEXPRESS;Database=admindb;Trusted_Connection=True;TrustServerCertificate=True;MultipleActiveResultSets=true;"
}
```

### EF Core Migrations
Migrations are used to manage database schema updates:
- **Migration Name:** `20261020191156_InitialCreate` (stored in `Migrations/`)
- **Commands:**
  ```powershell
  # Add a migration
  dotnet ef migrations add <MigrationName>

  # Apply migration to admindb
  dotnet ef database update
  ```

### Database Tables Created:
1. `users` (`Id`, `UserCode`, `Name`, `Email`, `MobileNumber`, `PasswordHash`, `IsActive`, `IsDeleted`, `CreatedAt`, `UpdatedAt`, `LastLoginAt`)
2. `roles` (`Id`, `Name`, `Description`, `CreatedAt`)
3. `user_roles` (`UserId`, `RoleId` PK)
4. `permissions` (`Id`, `Name`, `Description`, `Module`)
5. `role_permissions` (`RoleId`, `PermissionId` PK)
6. `user_permissions` (`UserId`, `PermissionId` PK)
7. `login_history` (`Id`, `UserId`, `Email`, `LoginAt`, `Status`, `IpAddress`, `UserAgent`, `FailureReason`)
8. `audit_logs` (`Id`, `ActorUserId`, `ActorName`, `Action`, `EntityType`, `EntityId`, `Details`, `CreatedAt`, `IpAddress`)
9. `company_settings` (`Id`, `CompanyName`, `Email`, `Phone`, `Address`, `City`, `TaxNumber`, `Currency`, `Timezone`, `Website`)
10. `refresh_tokens` (`Id`, `UserId`, `Token`, `ExpiresAt`, `IsRevoked`, `CreatedAt`)

---

## 3. Pre-Seeded Users (From AGRIMAN Screenshot)

The system automatically seeds the 6 users visible in the dashboard:

| User Code | Name | Email | Mobile | Role | Status | Last Login |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **USR-001** | Arjun Mehta | `arjun.mehta@agriman.in` | `+91 98765 43210` | Administrator | **Active** | Today, 09:42 AM |
| **USR-002** | Priya Sharma | `priya.sharma@agriman.in` | `+91 98765 12340` | Manager | **Active** | Today, 08:15 AM |
| **USR-003** | Rahul Verma | `rahul.verma@agriman.in` | `+91 91234 56780` | Accountant | **Active** | Yesterday, 04:26 PM |
| **USR-004** | Vikram Patel | `vikram.patel@agriman.in` | `+91 98220 11223` | Agronomist | **Active** | 2 days ago |
| **USR-005** | Ananya Rao | `ananya.rao@agriman.in` | `+91 97330 44556` | Field Supervisor | **Active** | 3 days ago |
| **USR-006** | Suresh Reddy | `suresh.reddy@agriman.in` | `+91 96110 77889` | Technician | **Inactive** | 5 days ago |

*Default seed password for all demo accounts:* **`AgriMan@2026`**

**SQL Server Live KPI Counts:**
- **TOTAL USERS:** 6
- **ACTIVE USERS:** 5
- **INACTIVE USERS:** 1

---

## 4. REST API Endpoint Reference

### 4.1 User Management (`/api/v1/users`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/users` | List users with pagination and search/filtering (`search`, `role`, `status`, `page`, `pageSize`) |
| `GET` | `/api/v1/users/{id}` | Get user details by ID |
| `POST` | `/api/v1/users` | Add a new user (auto-generates next `USR-xxx` code) |
| `PUT` | `/api/v1/users/{id}` | Update user details (Name, Email, MobileNumber, Roles) |
| `PATCH`| `/api/v1/users/{id}/status`| Activate or deactivate a user account |
| `DELETE`| `/api/v1/users/{id}` | Soft-delete a user (`IsDeleted = true`) |
| `GET` | `/api/v1/users/stats` | Dynamic dashboard user counts calculated from SQL Server |
| `GET` | `/api/v1/users/{id}/permissions` | Get permissions assigned to user |
| `PUT` | `/api/v1/users/{id}/permissions` | Save / update access permissions for an individual user |
| `POST`| `/api/v1/users/{id}/photo` | Upload or update user profile photo (multipart/form-data or JSON) |
| `DELETE`| `/api/v1/users/{id}/photo` | Remove user profile photo |
| `PUT` | `/api/v1/users/{id}/roles` | Assign roles to a user |
| `GET` | `/api/v1/users/{id}/login-history` | View login history for this specific user |

### 4.2 Roles & Permissions (`/api/v1/roles`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/roles` | Get available roles with description and user count |
| `GET` | `/api/v1/roles/{id}` | Get role details with assigned permissions |
| `POST` | `/api/v1/roles` | Create a new role |
| `PUT` | `/api/v1/roles/{id}` | Update role name / description |
| `DELETE`| `/api/v1/roles/{id}` | Delete role (if no users are assigned) |
| `GET` | `/api/v1/permissions` | Get all system permissions grouped by module |
| `PUT` | `/api/v1/roles/{id}/permissions` | Assign permissions to a role |

### 4.3 Company Settings (`/api/v1/company`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/company` | Get company settings and organization details |
| `PUT` | `/api/v1/company` | Update organization profile |

### 4.4 Audit Logs & Login History (`/api/v1`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/audit-logs` | Filter and paginate security audit trail |
| `GET` | `/api/v1/login-history` | List all system login events (success/failed) |

### 4.5 Authentication (`/api/v1/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Login with email & password; generates JWT access token and refresh token |
| `POST` | `/api/v1/auth/register` | Self-registration endpoint |
| `POST` | `/api/v1/auth/refresh-token` | Exchange refresh token for a new access token |
| `POST` | `/api/v1/auth/forgot-password` | Validate registered email and dispatch 6-digit OTP via email service |
| `POST` | `/api/v1/auth/verify-reset-otp` | Verify 6-digit OTP code and issue password reset token |
| `POST` | `/api/v1/auth/reset-password` | Reset password using verified token or OTP |
| `GET` | `/api/v1/auth/me` | Current authenticated user profile |

---

## 5. How to Run

1. Open a terminal in this directory:
   ```powershell
   cd "c:\Users\ADMIN\Desktop\AdminPage"
   dotnet run
   ```
2. Open your browser:
   - **Frontend UI (Settings → Users):** [http://localhost:5147/index.html](http://localhost:5147/index.html)
   - **Interactive Swagger UI:** [http://localhost:5147/swagger](http://localhost:5147/swagger)
