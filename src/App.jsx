import { Navigate, Route, Routes } from 'react-router-dom';
import RequireAuth from './auth/RequireAuth.jsx';
import Layout from './components/Layout.jsx';
import { ROLES } from './navigation.js';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import BooksPage from './pages/books/BooksPage.jsx';
import MembersPage from './pages/members/MembersPage.jsx';
import LoansPage from './pages/loans/LoansPage.jsx';
import NewLoanPage from './pages/loans/NewLoanPage.jsx';
import OverduePage from './pages/loans/OverduePage.jsx';

// Routes below the layout; each one is guarded by the same roles shown in the menu.
const PAGES = [
  { path: 'books', element: <BooksPage />, roles: ROLES.staff },
  { path: 'members', element: <MembersPage />, roles: ROLES.staff },
  { path: 'loans/new', element: <NewLoanPage />, roles: ROLES.staff },
  { path: 'loans', element: <LoansPage />, roles: ROLES.staff },
  { path: 'overdue', element: <OverduePage />, roles: ROLES.staff },
];

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }
      >
        <Route index element={<HomePage />} />
        {PAGES.map((page) => (
          <Route key={page.path} path={page.path} element={<RequireAuth roles={page.roles}>{page.element}</RequireAuth>} />
        ))}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
