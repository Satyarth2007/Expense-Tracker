import { Route, Routes, Navigate } from "react-router-dom"
import Home from "./pages/Home/Home"
import Register from "./pages/auth/Register"
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import Dashboard from "./pages/dashboard/Dashboard";
import AppShell from "./components/layout/AppShell";
import Categories from "./pages/categories/Categories";
import Account from "./pages/account/Account";
import Transactions from "./pages/transactions/Transactions";

function App() {

  return (
    <>
      <Routes>
        <Route path='/' element={<Home />} />
        {/* Default redirect — send root traffic to login for now */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forget-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* PROTECTED ROUTE */}
        <Route element={<ProtectedRoute />}>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<Dashboard />} />
            {/* later: /transactions, /categories, /budgets, etc. */}
            <Route path="/categories" element={<Categories />} />
            <Route path="/account" element={<Account />} />
            <Route path="/transactions" element={<Transactions />} />
          </Route>
        </Route>

        {/* Catch-all — fallback for unknown paths */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}

export default App
