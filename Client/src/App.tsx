import { Route, Routes } from "react-router-dom"
import Home from "./pages/Home/Home"
import Register from "./pages/auth/Register"

function App() {

  return (
    <>
      <Routes>
        <Route path='/' element={<Home />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </>
  )
}

export default App
