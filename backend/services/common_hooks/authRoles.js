import { Forbidden } from '@feathersjs/errors';

const ROLE_HIERARCHY = ['intern', 'staff', 'administrator'];

const SERVICE_PERMISSIONS = {
  'list_items': 'staff',
  'users': 'staff',
  'settings': 'staff',
  'snapshots': 'admin',
};

const INTERN_REVIEW_SERVICES = ['records', 'collections'];
const WRITE_METHODS = ['create', 'update', 'patch', 'remove'];

const authRoles = async (context) => {
  const { method, service, data, id, params } = context;
  if (!WRITE_METHODS.includes(method)) {
    return context;
  }
  const { user } = params;
  const serviceName = (service.options?.name || context.path).replace('api/', '');
  const userRole = user?.role;

  const userRoleValue = ROLE_HIERARCHY.indexOf(userRole);
  const serviceRoleValue = ROLE_HIERARCHY.indexOf(SERVICE_PERMISSIONS[serviceName]);
  console.log('USER', userRole, userRoleValue);
  console.log('SERVICE', serviceName, SERVICE_PERMISSIONS[serviceName], serviceRoleValue);
  // Only apply to write operations


  // Skip if no user (should be handled by authentication)

  // Check if service requires permissions
  if (serviceRoleValue && userRoleValue < serviceRoleValue) {
    throw new Forbidden(`Role '${userRole}' does not have write access to '${serviceName}'`);
  }

  // Prevent users from modifying their own user entry
  if (serviceName === 'users') {
    const targetUserId = id || data?.user_id;
    if (targetUserId && targetUserId.toString() === user.user_id.toString()) {
      delete data.role;
      delete data.active;
    }
  }

  // Set needs_review = true for intern writes to records/collections
  if (
    userRole === 'intern' &&
    INTERN_REVIEW_SERVICES.includes(serviceName) &&
    method !== 'remove'
  ) {
    context.data.needs_review = true;
  }

  return context;
};

export default authRoles;