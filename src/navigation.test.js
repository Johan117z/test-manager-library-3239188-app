import { describe, expect, it } from 'vitest';
import { navFor } from './navigation.js';

describe('role-aware navigation', () => {
  it('shows the report only to admin (CA-10.5)', () => {
    expect(navFor('admin').map((i) => i.to)).toContain('/reports/most-borrowed');
    expect(navFor('librarian').map((i) => i.to)).not.toContain('/reports/most-borrowed');
  });

  it('gives librarians books, members, loans and overdue', () => {
    expect(navFor('librarian').map((i) => i.to)).toEqual(['/', '/books', '/members', '/loans/new', '/loans', '/overdue']);
  });

  it('shows nothing for an unknown role', () => {
    expect(navFor('member')).toEqual([]);
  });
});
