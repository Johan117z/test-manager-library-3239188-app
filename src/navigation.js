// Single source for menu entries and the roles that can see them.
// Route guards in App.jsx use the same role lists.
export const ROLES = {
  staff: ['admin', 'librarian'],
  admin: ['admin'],
};

export const NAV_ITEMS = [
  { to: '/', label: 'Home', roles: ROLES.staff, end: true },
  { to: '/books', label: 'Books', roles: ROLES.staff },
  { to: '/members', label: 'Members', roles: ROLES.staff },
  { to: '/loans/new', label: 'New loan', roles: ROLES.staff },
  { to: '/loans', label: 'Loans', roles: ROLES.staff, end: true },
  { to: '/overdue', label: 'Overdue', roles: ROLES.staff },
  { to: '/reports/most-borrowed', label: 'Report', roles: ROLES.admin },
];

export function navFor(role) {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
