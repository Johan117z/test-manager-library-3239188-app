// In-memory mock of api-contract.md for UI testing while the real API is not ready.
// Not a reference implementation: it only mimics shapes, status codes and the single error body.
// Run: docker compose --profile mock up mock   (listens on :8100)
// Users: admin/admin123 (admin), ana/ana123 (librarian).
import http from 'node:http';
import { randomUUID } from 'node:crypto';

const DAY = 24 * 60 * 60 * 1000;
const users = { admin: { password: 'admin123', role: 'admin' }, ana: { password: 'ana123', role: 'librarian' } };
const tokens = new Map();
const categories = ['Ciencia', 'Historia', 'Infantil', 'Novela', 'Poesía'].map((name) => ({ id: randomUUID(), name }));
const cat = (name) => categories.find((c) => c.name === name);

const books = [];
const seed = [
  ['Cien años de soledad', 'Gabriel García Márquez', 'Novela'],
  ['El amor en los tiempos del cólera', 'Gabriel García Márquez', 'Novela'],
  ['Breve historia del tiempo', 'Stephen Hawking', 'Ciencia'],
  ['Veinte poemas de amor', 'Pablo Neruda', 'Poesía'],
  ['El principito', 'Antoine de Saint-Exupéry', 'Infantil'],
  ['Sapiens', 'Yuval Noah Harari', 'Historia'],
];
for (let i = 0; i < 26; i++) {
  const [title, author, c] = seed[i % seed.length];
  books.push({
    id: randomUUID(),
    title: i < seed.length ? title : `${title} (vol. ${Math.floor(i / seed.length) + 1})`,
    author,
    isbn: String(9780000000000 + i),
    category: cat(c),
    total_copies: i === 4 ? 1 : 4,
    available_copies: i === 4 ? 1 : 4,
    cover_key: null,
    deleted: false,
  });
}

const members = [
  'Laura Gómez', 'Carlos Pérez', 'María Rodríguez', 'Andrés López', 'Sofía Martínez',
  'Juan Herrera', 'Valentina Díaz', 'Diego Ramírez', 'Camila Torres', 'Mateo Castro',
].map((full_name, i) => ({ id: randomUUID(), full_name, document_number: String(1000000000 + i * 7919) }));

const loans = [];
function addLoan(member, bookList, loanedAt, returned = []) {
  const loan = {
    id: randomUUID(),
    member_id: member.id,
    loaned_at: new Date(loanedAt).toISOString(),
    items: bookList.map((b, idx) => {
      if (!returned[idx]) b.available_copies -= 1;
      return {
        id: randomUUID(), book_id: b.id, book_title: b.title, isbn: b.isbn, category_name: b.category.name,
        due_at: new Date(loanedAt + 14 * DAY).toISOString(), returned_at: returned[idx] ? new Date(loanedAt + 5 * DAY).toISOString() : null,
      };
    }),
  };
  loans.push(loan);
}
const now = Date.now();
addLoan(members[0], [books[0], books[2]], now - 20 * DAY); // overdue
addLoan(members[1], [books[3]], now - 16 * DAY); // overdue
addLoan(members[2], [books[0], books[5], books[1]], now - 3 * DAY);
addLoan(members[3], [books[2], books[3]], now - 30 * DAY, [true, true]); // closed
addLoan(members[4], [books[0]], now - 10 * DAY, [true]);

function loanStatus(loan) {
  const open = loan.items.filter((i) => !i.returned_at);
  if (open.length === 0) return 'closed';
  return open.some((i) => new Date(i.due_at).getTime() < Date.now()) ? 'overdue' : 'open';
}
const loanView = (loan) => ({ ...loan, status: loanStatus(loan) });

const cors = (h = {}) => ({
  ...h,
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
});
function send(res, status, body) {
  res.writeHead(status, cors({ 'Content-Type': 'application/json' }));
  res.end(body === undefined ? '' : JSON.stringify(body));
}
const err = (res, status, code, message, details = []) => send(res, status, { code, message, details });
const bookView = ({ deleted, ...b }) => b;
function paginate(url, list) {
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const size = Math.min(50, Math.max(1, Number(url.searchParams.get('size')) || 20));
  return { items: list.slice((page - 1) * size, page * size), page, size, total: list.length };
}
const dateOk = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');

function validateBook(body, isCreate) {
  const details = [];
  if (!body.title?.trim()) details.push({ field: 'title', issue: 'obligatorio' });
  if (!body.author?.trim()) details.push({ field: 'author', issue: 'obligatorio' });
  if (isCreate && !/^\d{13}$/.test(body.isbn || '')) details.push({ field: 'isbn', issue: 'debe tener 13 dígitos' });
  if (!categories.some((c) => c.id === body.category_id)) details.push({ field: 'category_id', issue: 'categoría inexistente' });
  if (!Number.isInteger(body.total_copies) || body.total_copies < 1) details.push({ field: 'total_copies', issue: 'debe ser ≥ 1' });
  return details;
}

http
  .createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, cors());
      return res.end();
    }
    const url = new URL(req.url, 'http://x');
    const path = url.pathname.replace(/^\/api\/v1/, '');
    let raw = '';
    for await (const chunk of req) raw += chunk;
    let body = {};
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      return err(res, 422, 'VALIDATION_ERROR', 'El cuerpo no es JSON válido.');
    }

    if (path === '/health') return send(res, 200, { status: 'ok' });
    if (req.method === 'POST' && path === '/auth/login') {
      const u = users[(body.username || '').trim().toLowerCase()];
      if (!u || u.password !== body.password) return err(res, 401, 'INVALID_CREDENTIALS', 'Usuario o contraseña inválidos.');
      const t = randomUUID();
      tokens.set(t, u.role);
      return send(res, 200, { access_token: t, token_type: 'Bearer', expires_in: 28800, role: u.role });
    }
    const role = tokens.get((req.headers.authorization || '').replace('Bearer ', ''));
    if (!role) return err(res, 401, 'INVALID_CREDENTIALS', 'Token ausente, inválido o vencido.');
    const adminOnly = () => role !== 'admin' && (err(res, 403, 'FORBIDDEN_ROLE', 'Tu rol no permite esta operación.'), true);

    // Categories and books
    if (path === '/categories') return send(res, 200, categories);
    if (path === '/books' && req.method === 'GET') {
      const q = (url.searchParams.get('q') || '').toLowerCase();
      const c = url.searchParams.get('category_id');
      const found = books
        .filter((b) => !b.deleted && (!c || b.category.id === c) && (!q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)))
        .sort((a, b) => a.title.localeCompare(b.title))
        .map(bookView);
      return send(res, 200, paginate(url, found));
    }
    if (path === '/books' && req.method === 'POST') {
      if (adminOnly()) return;
      const details = validateBook(body, true);
      if (details.length) return err(res, 422, 'VALIDATION_ERROR', 'Hay campos inválidos.', details);
      if (books.some((b) => !b.deleted && b.isbn === body.isbn))
        return err(res, 409, 'ISBN_TAKEN', `Ya existe un libro activo con el ISBN ${body.isbn}.`, [{ field: 'isbn', issue: 'repetido' }]);
      const book = {
        id: randomUUID(), title: body.title, author: body.author, isbn: body.isbn,
        category: categories.find((x) => x.id === body.category_id), total_copies: body.total_copies,
        available_copies: body.total_copies, cover_key: null, deleted: false,
      };
      books.push(book);
      return send(res, 201, bookView(book));
    }
    let m = path.match(/^\/books\/([^/]+)$/);
    if (m) {
      if (req.method !== 'GET' && adminOnly()) return;
      const book = books.find((b) => b.id === m[1] && !b.deleted);
      if (!book) return err(res, 404, 'NOT_FOUND', 'El libro no existe.');
      if (req.method === 'GET') return send(res, 200, bookView(book));
      if (req.method === 'PUT') {
        const details = validateBook(body, false);
        if (details.length) return err(res, 422, 'VALIDATION_ERROR', 'Hay campos inválidos.', details);
        const available = book.available_copies + (body.total_copies - book.total_copies);
        if (available < 0)
          return err(res, 422, 'VALIDATION_ERROR', 'El nuevo total dejaría disponibles por debajo de cero.', [
            { field: 'total_copies', issue: `mínimo ${book.total_copies - book.available_copies}` },
          ]);
        Object.assign(book, {
          title: body.title, author: body.author, category: categories.find((x) => x.id === body.category_id),
          total_copies: body.total_copies, available_copies: available,
        });
        return send(res, 200, bookView(book));
      }
      if (req.method === 'DELETE') {
        if (loans.some((l) => l.items.some((i) => i.book_id === book.id && !i.returned_at)))
          return err(res, 409, 'BOOK_HAS_OPEN_LOANS', `«${book.title}» tiene préstamos abiertos y no se puede dar de baja.`);
        book.deleted = true;
        return send(res, 204);
      }
    }

    // Members
    const unreturned = (memberId) => loans.filter((l) => l.member_id === memberId).flatMap((l) => l.items).filter((i) => !i.returned_at);
    if (path === '/members' && req.method === 'GET') {
      const q = (url.searchParams.get('q') || '').toLowerCase();
      const found = members
        .filter((x) => !q || x.full_name.toLowerCase().includes(q) || x.document_number.includes(q))
        .sort((a, b) => a.full_name.localeCompare(b.full_name));
      return send(res, 200, paginate(url, found));
    }
    if (path === '/members' && req.method === 'POST') {
      const details = [];
      if (!body.full_name?.trim()) details.push({ field: 'full_name', issue: 'obligatorio' });
      if (!body.document_number?.trim()) details.push({ field: 'document_number', issue: 'obligatorio' });
      if (details.length) return err(res, 422, 'VALIDATION_ERROR', 'Hay campos inválidos.', details);
      if (members.some((x) => x.document_number === body.document_number.trim()))
        return err(res, 409, 'DOCUMENT_TAKEN', `Ya existe un socio con el documento ${body.document_number.trim()}.`, [{ field: 'document_number', issue: 'repetido' }]);
      const member = { id: randomUUID(), full_name: body.full_name.trim(), document_number: body.document_number.trim() };
      members.push(member);
      return send(res, 201, member);
    }
    m = path.match(/^\/members\/([^/]+)$/);
    if (m && req.method === 'GET') {
      const member = members.find((x) => x.id === m[1]);
      if (!member) return err(res, 404, 'NOT_FOUND', 'El socio no existe.');
      return send(res, 200, { ...member, active_loans: unreturned(member.id).length });
    }

    // Loans
    if (path === '/loans/overdue' && req.method === 'GET') {
      const rows = loans
        .flatMap((l) =>
          l.items
            .filter((i) => !i.returned_at && new Date(i.due_at).getTime() < Date.now())
            .map((i) => ({
              loan_id: l.id, item_id: i.id, book_title: i.book_title,
              member_name: members.find((x) => x.id === l.member_id)?.full_name, due_at: i.due_at,
              days_late: Math.floor((Date.now() - new Date(i.due_at).getTime()) / DAY),
            })),
        )
        .sort((a, b) => b.days_late - a.days_late);
      return send(res, 200, paginate(url, rows));
    }
    if (path === '/loans' && req.method === 'GET') {
      const from = url.searchParams.get('from');
      const to = url.searchParams.get('to');
      const status = url.searchParams.get('status');
      const memberId = url.searchParams.get('member_id');
      if (from && to && to < from) return err(res, 422, 'INVALID_DATE_RANGE', 'La fecha final es anterior a la inicial.');
      const found = loans
        .map(loanView)
        .filter((l) => (!from || l.loaned_at.slice(0, 10) >= from) && (!to || l.loaned_at.slice(0, 10) <= to))
        .filter((l) => (!status || l.status === status) && (!memberId || l.member_id === memberId))
        .sort((a, b) => b.loaned_at.localeCompare(a.loaned_at));
      return send(res, 200, paginate(url, found));
    }
    if (path === '/loans' && req.method === 'POST') {
      const items = body.items;
      if (!body.member_id || !Array.isArray(items) || items.length < 1 || items.length > 3)
        return err(res, 422, 'VALIDATION_ERROR', 'El préstamo necesita un socio y de 1 a 3 libros.', [{ field: 'items', issue: 'entre 1 y 3' }]);
      const ids = items.map((i) => i.book_id);
      const dup = ids.findIndex((id, idx) => ids.indexOf(id) !== idx);
      if (dup >= 0) return err(res, 422, 'DUPLICATE_BOOK_IN_LOAN', 'No se puede repetir el mismo libro en un préstamo.', [{ field: `items[${dup}].book_id`, issue: 'repetido' }]);
      const member = members.find((x) => x.id === body.member_id);
      if (!member) return err(res, 404, 'NOT_FOUND', 'El socio no existe.');
      const bookList = ids.map((id) => books.find((b) => b.id === id && !b.deleted));
      const missing = bookList.findIndex((b) => !b);
      if (missing >= 0) return err(res, 404, 'NOT_FOUND', 'El libro no existe.', [{ field: `items[${missing}].book_id`, issue: 'no existe' }]);
      const open = unreturned(member.id);
      if (open.some((i) => new Date(i.due_at).getTime() < Date.now()))
        return err(res, 409, 'MEMBER_HAS_OVERDUE', `${member.full_name} tiene libros vencidos y no puede pedir más hasta devolverlos.`);
      if (open.length + items.length > 3)
        return err(res, 422, 'MEMBER_LIMIT_EXCEEDED', `El socio ya tiene ${open.length} libros sin devolver; el máximo es 3.`, [{ field: 'items', issue: `sin devolver: ${open.length}` }]);
      const empty = bookList.findIndex((b) => b.available_copies < 1);
      if (empty >= 0)
        return err(res, 409, 'BOOK_NOT_AVAILABLE', `No quedan ejemplares disponibles de «${bookList[empty].title}».`, [{ field: `items[${empty}].book_id`, issue: 'sin ejemplares' }]);
      addLoan(member, bookList, Date.now());
      return send(res, 201, loanView(loans[loans.length - 1]));
    }
    m = path.match(/^\/loans\/([^/]+)$/);
    if (m && req.method === 'GET') {
      const loan = loans.find((l) => l.id === m[1]);
      if (!loan) return err(res, 404, 'NOT_FOUND', 'El préstamo no existe.');
      return send(res, 200, loanView(loan));
    }
    m = path.match(/^\/loans\/([^/]+)\/items\/([^/]+)\/return$/);
    if (m && req.method === 'POST') {
      const item = loans.find((l) => l.id === m[1])?.items.find((i) => i.id === m[2]);
      if (!item) return err(res, 404, 'NOT_FOUND', 'La línea de préstamo no existe.');
      if (item.returned_at) return err(res, 409, 'ITEM_ALREADY_RETURNED', `«${item.book_title}» ya fue devuelto.`);
      item.returned_at = new Date().toISOString();
      const book = books.find((b) => b.id === item.book_id);
      if (book) book.available_copies = Math.min(book.total_copies, book.available_copies + 1);
      return send(res, 200, item);
    }

    // Report
    if (path === '/reports/most-borrowed' && req.method === 'GET') {
      if (adminOnly()) return;
      const from = url.searchParams.get('from');
      const to = url.searchParams.get('to');
      if (!dateOk(from) || !dateOk(to))
        return err(res, 422, 'VALIDATION_ERROR', 'Las fechas inicial y final son obligatorias (AAAA-MM-DD).', [
          ...(dateOk(from) ? [] : [{ field: 'from', issue: 'obligatorio' }]),
          ...(dateOk(to) ? [] : [{ field: 'to', issue: 'obligatorio' }]),
        ]);
      if (to < from) return err(res, 422, 'INVALID_DATE_RANGE', 'La fecha final es anterior a la inicial.');
      const counts = new Map();
      loans
        .filter((l) => l.loaned_at.slice(0, 10) >= from && l.loaned_at.slice(0, 10) <= to)
        .flatMap((l) => l.items)
        .forEach((i) => {
          const key = `${i.book_id}|${i.book_title}|${i.category_name}`;
          const row = counts.get(key) || { book_id: i.book_id, book_title: i.book_title, category_name: i.category_name, times_borrowed: 0 };
          row.times_borrowed += 1;
          counts.set(key, row);
        });
      const rows = [...counts.values()].sort((a, b) => b.times_borrowed - a.times_borrowed || a.book_title.localeCompare(b.book_title));
      return send(res, 200, { from, to, rows });
    }

    return err(res, 404, 'NOT_FOUND', 'Recurso no encontrado.');
  })
  .listen(8100, () => console.log('Manager Library mock API on http://localhost:8100/api/v1'));
