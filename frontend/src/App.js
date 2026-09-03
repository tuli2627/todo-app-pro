// import Layout from "./components/common/Layout";
// import Home from "./pages/home/Home";

//   function App() {
//      return ( <Layout> <Home /> </Layout> );
//      } export default App
// import { BrowserRouter, Routes, Route } from "react-router-dom";

// import Layout from "./components/common/Layout";
// import Home from "./pages/home/Home";
// import Dashboard from "./pages/dashboard/Dashboard";
// import Login from "./pages/login/Login";

// function App() {
//   return (
//     <BrowserRouter>
//       <Layout>
//         <Routes>
//           <Route path="/" element={<Home />} />
//           <Route path="/dashboard" element={<Dashboard />} />
//           <Route path="/login/national" element={<Login />} />
// <Route path="/login/state" element={<Login />} />
// <Route path="/login/circle" element={<Login />} />
// <Route path="/login/dfo" element={<Login />} />
// <Route path="/login/ro" element={<Login />} />
// <Route path="/login/silviculturist" element={<Login />} />
//         </Routes>
//       </Layout>
//     </BrowserRouter>
//   );
// }

// export default App;
// import "./i18n";
// import Faqs from "./pages/faqs/Faqs";
// import { BrowserRouter, Routes, Route } from "react-router-dom";

// import Layout from "./components/common/Layout";
// import Home from "./pages/home/Home";
// import Dashboard from "./pages/dashboard/Dashboard";
// import Login from "./pages/login/Login";

// // 1. Add the import for your new Advance Booking component
// import AdvanceBooking from "./pages/advancebooking/AdvanceBooking";
// import LanguageSwitcher from "./LanguageSwitcher";

// function App() {
//   return (
//     <BrowserRouter>
//       <Layout>
//         <Routes>
//           <Route path="/" element={<Home />} />
//           <Route path="/dashboard" element={<Dashboard />} />
//           <Route path="/faqs" element={<Faqs />} />
//           {/* 2. Add the Route for Advance Booking */}
//           <Route path="/advance-booking" element={<AdvanceBooking />} />

//           <Route path="/login/national" element={<Login />} />
//           <Route path="/login/state" element={<Login />} />
//           <Route path="/login/circle" element={<Login />} />
//           <Route path="/login/dfo" element={<Login />} />
//           <Route path="/login/ro" element={<Login />} />
//           <Route path="/login/silviculturist" element={<Login />} />
//         </Routes>
//       </Layout>
//     </BrowserRouter>
//   );
// }

// export default App;
// 1. IMPORTANT: Import your i18n file here so it runs when the app starts
// import "./utils/i18n";
// import Faqs from "./pages/faqs/Faqs";
// import { BrowserRouter, Routes, Route } from "react-router-dom";

// import Layout from "./components/common/Layout";
// import Home from "./pages/home/Home";
// import Dashboard from "./pages/dashboard/Dashboard";
// import Login from "./pages/login/Login";
// import AdvanceBooking from "./pages/advancebooking/AdvanceBooking";

// // 2. Import the Language Switcher you created in the previous step
// // (Make sure the path matches where you saved the file)
// import LanguageSwitcher from "./LanguageSwitcher"; 

// function App() {
//   return (
//     <BrowserRouter>
//       {/* 3. I placed the switcher right above your layout so you can test it immediately. 
//           You can move this inside your Header or Layout component later if you prefer! */}
//       {/* <div style={{ textAlign: "right", padding: "10px", backgroundColor: "#f4f4f4" }}>
//         <LanguageSwitcher />
//       </div> */}

//       <Layout>
//         <Routes>
//           <Route path="/" element={<Home />} />
//           <Route path="/dashboard" element={<Dashboard />} />
//           <Route path="/faqs" element={<Faqs />} />
//           <Route path="/advance-booking" element={<AdvanceBooking />} />

//           <Route path="/login/national" element={<Login />} />
//           <Route path="/login/state" element={<Login />} />
//           <Route path="/login/circle" element={<Login />} />
//           <Route path="/login/dfo" element={<Login />} />
//           <Route path="/login/ro" element={<Login />} />
//           <Route path="/login/silviculturist" element={<Login />} />
//         </Routes>
//       </Layout>
//     </BrowserRouter>
//   );
// }

// export default App;
import "./utils/i18n";
import Faqs from "./pages/faqs/Faqs";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/common/Layout";
import Home from "./pages/home/Home";
import Dashboard from "./pages/dashboard/Dashboard";
import Login from "./pages/login/Login";
import AdvanceBooking from "./pages/advancebooking/AdvanceBooking";
import SpeciesPage from "./SpeciesPage";

// 1. Import your newly created SpeciesPage component
// (Adjust the path if you saved SpeciesPage in a diff

// 2. Import the Language Switcher
import LanguageSwitcher from "./LanguageSwitcher"; 

function App() {
  return (
    <BrowserRouter>
      {/* <div style={{ textAlign: "right", padding: "10px", backgroundColor: "#f4f4f4" }}>
        <LanguageSwitcher />
      </div> */}

      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/faqs" element={<Faqs />} />
          <Route path="/advance-booking" element={<AdvanceBooking />} />

          {/* Species page route */}
          <Route path="/species" element={<SpeciesPage />} />

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