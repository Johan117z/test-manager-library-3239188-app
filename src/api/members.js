import { api } from './client.js';

// api-contract.md §3.5. Members are never deleted (CA-05.3).
export const searchMembers = ({ q, page, size }) => api.get('/members', { q, page, size });
export const getMember = (id) => api.get(`/members/${id}`);
export const createMember = ({ full_name, document_number }) => api.post('/members', { full_name, document_number });
