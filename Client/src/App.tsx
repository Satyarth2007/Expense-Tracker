import { Route, Routes, Navigate } from "react-router-dom"
import Home from "./pages/Home/Home"
import Register from "./pages/auth/Register"
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";

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


        {/* Catch-all — fallback for unknown paths */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </>
  )
}

export default App
