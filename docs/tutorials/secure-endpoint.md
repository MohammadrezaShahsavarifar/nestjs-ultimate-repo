# @SecureEndpoint

A custom decorator to secure endpoints by applying JWT authentication, Role-Based Access Control (RBAC),.

## Usage:
```typescript
@SecureEndpoint(['admin'],)
@Get('admin-dashboard')
getAdminDashboard() {
  return { message: 'Welcome to the Admin Dashboard' };
}