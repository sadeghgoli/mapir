// ===== Identity Constants =====
// این فایل معادل C# class Map.Shared.Auth.Permissions هست
// هر جا نیاز به اسم رول یا permission داری، از این ثابت‌ها استفاده کن
// تا بین backend و frontend یکسان باشن

export const ROLES = {
  SUPER_ADMIN: 'ROLE_SUPER_ADMIN',
  ADMIN: 'ROLE_ADMIN',
  OPERATOR: 'ROLE_OPERATOR',
  VIEWER: 'ROLE_VIEWER',
  EMPLOYEE: 'ROLE_EMPLOYEE',
  CITIZEN: 'ROLE_CITIZEN',
} as const;

export const PERMISSIONS = {
  POINT_CREATE: 'point:create',
  POINT_READ: 'point:read',
  POINT_UPDATE: 'point:update',
  POINT_DELETE: 'point:delete',
  POINT_REVIEW: 'point:review',
  CATEGORY_READ: 'category:read',
  CATEGORY_CREATE: 'category:create',
  CATEGORY_UPDATE: 'category:update',
  CATEGORY_DELETE: 'category:delete',
  GUIDE_READ: 'guide:read',
  GUIDE_CREATE: 'guide:create',
  GUIDE_UPDATE: 'guide:update',
  GUIDE_DELETE: 'guide:delete',
  GROUP_MANAGE: 'group:manage',
  USER_MANAGE: 'user:manage',
} as const;
