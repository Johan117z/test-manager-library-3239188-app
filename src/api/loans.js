import { api } from './client.js';

// api-contract.md §3.6 and §3.7.
export const MAX_ITEMS_PER_LOAN = 3;

export const createLoan = (memberId, bookIds) =>
  api.post('/loans', { member_id: memberId, items: bookIds.map((book_id) => ({ book_id })) });

export const listLoans = ({ from, to, status, memberId, page, size }) =>
  api.get('/loans', { from, to, status, member_id: memberId, page, size });

export const getLoan = (id) => api.get(`/loans/${id}`);

export const returnItem = (loanId, itemId) => api.post(`/loans/${loanId}/items/${itemId}/return`);

export const listOverdue = ({ page, size } = {}) => api.get('/loans/overdue', { page, size });

export const mostBorrowed = ({ from, to }) => api.get('/reports/most-borrowed', { from, to });
