import "./utils/i18n";
import Faqs from "./pages/faqs/Faqs";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/common/Layout";
import Home from "./pages/home/Home";
import Dashboard from "./pages/dashboard/Dashboard";
import Login from "./pages/login/Login";
import AdvanceBooking from "./pages/advancebooking/AdvanceBooking";
import Nursery from "./pages/Nursery/Nursery";
import UserGuides from "./pages/documentation/UserGuides";
import AboutUs from "./pages/about/AboutUs";


function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/faqs" element={<Faqs />} />
          <Route path="/advance-booking" element={<AdvanceBooking />} />
          <Route path="/our-nurseries" element={<Nursery />} />
          <Route path="/documentation" element={<UserGuides />} />
          <Route path="/about-us" element={<AboutUs />} />
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