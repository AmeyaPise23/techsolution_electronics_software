# Admin Authentication System

Complete authentication system for the admin panel with Spring Boot backend integration.

## ✨ Features

✅ **Admin Login Page** - Professional login UI with validation
✅ **Spring Boot Integration** - JWT token-based authentication
✅ **Protected Routes** - All admin routes require authentication
✅ **Session Persistence** - Automatic login on page refresh
✅ **Token Refresh** - Automatic token refresh on expiration
✅ **User Profile Dropdown** - Username, role, and logout
✅ **Existing Admin Button** - Enhanced with auth check
✅ **Remember Me** - Optional session persistence
✅ **Form Validation** - Client-side validation
✅ **Error Handling** - User-friendly error messages
✅ **Loading States** - Visual feedback during login

## 🔐 Authentication Flow

### 1. User Clicks Admin Button

**Navbar Admin Button Behavior:**
```
User clicks Admin button (LayoutDashboard icon)
    ↓
Check authentication status
    ↓
If NOT authenticated → Navigate to /admin/login
If authenticated → Navigate to /admin (dashboard)
```

### 2. Login Process

**Login Page (`/admin/login`):**
```
User enters username & password
    ↓
Form validation
    ↓
POST to Spring Boot API: /api/auth/login
    ↓
Receive JWT tokens & user info
    ↓
Store in localStorage:
  - auth_token (JWT)
  - refresh_token
  - user_info (username, role)
    ↓
Redirect to /admin (or intended page)
```

### 3. Protected Routes

**All Admin Routes Protected:**
```
User navigates to /admin/*
    ↓
ProtectedRoute checks authentication
    ↓
If NOT authenticated → Redirect to /admin/login
If authenticated → Render page
```

### 4. Token Expiration

**Automatic Token Refresh:**
```
API request fails with 401
    ↓
Attempt to refresh token
    ↓
POST to /api/auth/refresh
    ↓
Success: Update token, retry request
Failure: Logout user, redirect to login
```

### 5. Logout

**User Logout Flow:**
```
User clicks Logout in dropdown
    ↓
Clear localStorage:
  - auth_token
  - refresh_token
  - user_info
    ↓
Navigate to /admin/login
```

## 🔧 Spring Boot API Integration

### Backend URL Configuration

Update in `/src/app/services/authService.ts`:

```typescript
const API_BASE_URL = "http://localhost:8080/api";
```

Replace with your Spring Boot backend URL.

### Required API Endpoints

#### 1. Login

```
POST /api/auth/login

Request Body:
{
  "username": "admin",
  "password": "password123"
}

Response (Success - 200):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "username": "admin",
  "role": "ADMIN"
}

Response (Error - 401):
{
  "error": "Invalid username or password"
}
```

#### 2. Refresh Token

```
POST /api/auth/refresh

Request Body:
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response (Success - 200):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

Response (Error - 401):
{
  "error": "Invalid or expired refresh token"
}
```

### JWT Token Structure

**Expected JWT Payload:**
```json
{
  "sub": "admin",
  "role": "ADMIN",
  "iat": 1622547800,
  "exp": 1622551400
}
```

The `exp` (expiration) field is used to check token validity.

## 📁 Files Created

### Services
```
src/app/services/authService.ts    - Authentication API calls and token management
```

### Context
```
src/app/context/AuthContext.tsx     - Global authentication state
```

### Components
```
src/app/components/ProtectedRoute.tsx  - Route protection wrapper
```

### Pages
```
src/app/pages/admin-login.tsx       - Admin login page
```

### Updated Files (Minimal Changes)
```
src/app/App.tsx                     - Wrapped with AuthProvider
src/app/routes.tsx                  - Added login route & protected routes
src/app/components/navbar.tsx       - Enhanced admin button with auth check
src/app/components/admin-layout.tsx - Added user profile dropdown
```

## 🔒 Protected Routes

All these routes now require authentication:

```
/admin                          → Dashboard
/admin/products                 → Products Management
/admin/orders                   → Orders
/admin/settings                 → Settings

/admin/finance/*               → All Finance pages
/admin/repair-orders/*         → All Repair Order pages
```

## 💾 Session Storage

**LocalStorage Keys:**
- `auth_token` - JWT access token
- `refresh_token` - Refresh token for renewing access
- `user_info` - JSON string with username and role

**Session Persistence:**
- User stays logged in across page refreshes
- Tokens automatically refresh before expiration
- Invalid tokens trigger automatic logout

## 🎨 UI Components

### Login Page Features

**Fields:**
- Username input with icon
- Password input with show/hide toggle
- Remember me checkbox

**States:**
- Loading state during login
- Error messages display
- Form validation

**Design:**
- Centered card layout
- Professional branding
- Responsive design
- Consistent with admin panel theme

### User Profile Dropdown

**Location:** Bottom of admin sidebar

**Displays:**
- User initials avatar
- Username
- Role (ADMIN)
- Dropdown menu

**Menu Items:**
- Profile (disabled - future feature)
- Logout

## 🚀 Usage

### For Users

1. **Access Admin Panel:**
   - Click Admin icon in navbar
   - Redirected to login if not authenticated

2. **Login:**
   - Enter username and password
   - Click "Sign In"
   - Redirected to admin dashboard

3. **Logout:**
   - Click user dropdown in sidebar
   - Click "Logout"
   - Redirected to login page

### For Developers

#### Use Auth Context

```typescript
import { useAuth } from "../context/AuthContext";

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <div>Please log in</div>;
  }

  return <div>Welcome {user?.username}</div>;
}
```

#### Make Authenticated API Calls

```typescript
import { authService } from "../services/authService";

// Automatic token inclusion and refresh
const response = await authService.authenticatedFetch(
  "http://localhost:8080/api/data",
  {
    method: "GET",
  }
);
```

#### Get Authorization Header

```typescript
import { authService } from "../services/authService";

const headers = authService.getAuthHeader();
// Returns: { Authorization: "Bearer eyJhbGciOi..." }
```

## 🔐 Security Features

### Token Management
- JWT tokens stored in localStorage
- Automatic token expiration checking
- Token refresh before expiration
- Secure token parsing and validation

### Route Protection
- All admin routes require authentication
- Automatic redirect to login
- Return to intended page after login

### Session Handling
- Automatic logout on invalid token
- Session persistence across page refreshes
- Configurable session duration (via JWT exp)

### Error Handling
- User-friendly error messages
- Network error detection
- API error response handling
- Toast notifications for errors

## ⚙️ Configuration

### Update Backend URL

Edit `/src/app/services/authService.ts`:

```typescript
const API_BASE_URL = "http://your-backend-url.com/api";
```

### Customize Token Keys

Edit localStorage keys in `authService.ts`:

```typescript
const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_KEY = "user_info";
```

### Remember Me Duration

Currently stored indefinitely in localStorage.
To implement expiration, add timestamp check in `authService.isAuthenticated()`.

## 🧪 Testing

### Test Login Flow

1. Navigate to `/admin` without being logged in
2. Should redirect to `/admin/login`
3. Enter credentials
4. Should redirect to `/admin` on success
5. Should show error on invalid credentials

### Test Token Refresh

1. Login successfully
2. Manually expire token (edit in localStorage)
3. Make API request
4. Should automatically refresh and retry

### Test Logout

1. Login successfully
2. Click user dropdown
3. Click Logout
4. Should clear tokens and redirect to login

### Test Protected Routes

1. Logout
2. Try to navigate directly to `/admin/products`
3. Should redirect to `/admin/login`

## 📝 Spring Boot Backend Example

### Controller

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // Validate credentials
        if (authenticate(request.getUsername(), request.getPassword())) {
            String token = generateToken(request.getUsername());
            String refreshToken = generateRefreshToken(request.getUsername());
            
            return ResponseEntity.ok(new LoginResponse(
                token,
                refreshToken,
                request.getUsername(),
                "ADMIN"
            ));
        }
        
        return ResponseEntity.status(401).body("Invalid credentials");
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@RequestBody RefreshRequest request) {
        if (validateRefreshToken(request.getRefreshToken())) {
            String newToken = generateToken(extractUsername(request.getRefreshToken()));
            return ResponseEntity.ok(new RefreshResponse(newToken));
        }
        
        return ResponseEntity.status(401).body("Invalid refresh token");
    }
}
```

## 🎯 Important Notes

### No Existing Functionality Modified

✅ All existing features work exactly as before:
- Dashboard
- Products
- Orders
- Customers
- Finance (all pages)
- Repair Orders (all pages)
- Reports
- Settings

### Only Additions Made

➕ Admin login page
➕ Authentication context
➕ Protected route wrapper
➕ User profile dropdown
➕ Auth service
➕ Enhanced admin button behavior

### No New Admin Buttons

✅ Uses the EXISTING admin button in navbar
✅ No duplicate admin navigation items
✅ No new registration/signup pages

## 🐛 Troubleshooting

### Login fails with network error
- Check Spring Boot backend is running
- Verify `API_BASE_URL` is correct
- Check CORS configuration on backend

### Token refresh fails
- Verify `/api/auth/refresh` endpoint exists
- Check refresh token is being stored
- Validate refresh token format on backend

### User logged out unexpectedly
- Check JWT expiration time
- Verify token refresh logic
- Check localStorage is not being cleared

### Redirect loop on login
- Verify login response includes all required fields
- Check token is being stored in localStorage
- Validate `isAuthenticated()` logic

## 🎉 Summary

You now have a **complete authentication system** for the admin panel:

- ✅ Professional login page with Spring Boot integration
- ✅ JWT token-based authentication
- ✅ All admin routes protected
- ✅ Automatic token refresh
- ✅ User profile dropdown with logout
- ✅ Enhanced existing admin button
- ✅ Session persistence
- ✅ Form validation and error handling
- ✅ Loading states and user feedback
- ✅ Ready for production after backend integration

**NO existing functionality was modified** - only authentication was added! 🔐
