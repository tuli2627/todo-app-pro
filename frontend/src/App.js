// import Layout from "./components/common/Layout";
// import Home from "./pages/home/Home";

//   function App() {
//      return ( <Layout> <Home /> </Layout> );
//      } export default App
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/common/Layout";
import Home from "./pages/home/Home";
import Dashboard from "./pages/dashboard/Dashboard";
import Login from "./pages/login/Login";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login/national" element={<Login />} />
<Route path="/login/state" element={<Login />} />
<Route path="/login/circle" element={<Login />} />
<Route path="/login/dfo" element={<Login />} />
<Route path="/login/ro" element={<Login />} />
<Route path="/login/silviculturist" element={<Login />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;