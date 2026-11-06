// Single source for menu entries and the roles that can see them.
// Route guards in App.jsx use the same role lists.
export const ROLES = {
  staff: ['admin', 'librarian'],
  admin: ['admin'],
};

export const NAV_ITEMS = [{ to: '/', label: 'Home', roles: ROLES.staff, end: true }];

export function navFor(role) {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
