
// import DashboardCharts from "../../components/Map/DashboardCharts";
// import IndiaMap from "../../components/Map/IndiaMap";
// import { Link, useNavigate } from "react-router-dom"; // 1. Added useNavigate import
// import "./Dashboard.css";
// import { Swiper, SwiperSlide } from 'swiper/react';
// import { Navigation, Pagination, Autoplay } from 'swiper/modules';

// import 'swiper/css';
// import 'swiper/css/navigation';
// import 'swiper/css/pagination';

// import Banner_1 from "../../assets/images/Banner_1.jpg";
// import Banner_2 from "../../assets/images/Banner_2.jpg";
// import Banner_3 from "../../assets/images/Banner_3.jpg";
// import Banner_4 from "../../assets/images/Banner_4.jpeg";
// import Banner_5 from "../../assets/images/Banner_5.jpg";
// import Banner_6 from "../../assets/images/Banner_6.jpeg";

// // Helper function to split images into groups of 6
// const chunkArray = (arr, size) => {
//   const chunks = [];
//   for (let i = 0; i < arr.length; i += size) {
//     chunks.push(arr.slice(i, i + size));
//   }
//   return chunks;
// };

// function Dashboard() {
//   const navigate = useNavigate(); // 2. Initialize useNavigate hook

//   const carouselImages = [
//     { id: 1, src: Banner_1, alt: "Harit Sankalp Banner 1" },
//     { id: 2, src: Banner_2, alt: "Harit Sankalp Banner 2" },
//     { id: 3, src: Banner_3, alt: "Harit Sankalp Banner 3" },
//     { id: 4, src: Banner_4, alt: "Harit Sankalp Banner 4" },
//     { id: 5, src: Banner_5, alt: "Harit Sankalp Banner 5" },
//     { id: 6, src: Banner_6, alt: "Harit Sankalp Banner 6" }
//   ];

//   const imageGroups = chunkArray(carouselImages, 6);

//   return (
//     <div className="dashboard">

//       {/* Carousel Section */}
//       <section className="carousel-section">
//         <Swiper
//           modules={[Navigation, Pagination, Autoplay]}
//           slidesPerView={3}
//           slidesPerGroup={3}
//           spaceBetween={20}
//           navigation
//           pagination={{ clickable: true }}
//           autoplay={{ delay: 4000, disableOnInteraction: false }}
//           loop={true}
//           breakpoints={{
//             320: { slidesPerView: 1, slidesPerGroup: 1, spaceBetween: 10 },
//             768: { slidesPerView: 2, slidesPerGroup: 2, spaceBetween: 15 },
//             1024: { slidesPerView: 3, slidesPerGroup: 3, spaceBetween: 20 },
//           }}
//         >
//           {carouselImages.map((image) => (
//             <SwiperSlide key={image.id}>
//               <div className="single-card">
//                 <img src={image.src} alt={image.alt} />
//               </div>
//             </SwiperSlide>
//           ))}
//         </Swiper>
//       </section>

//       {/* India Map Section */}
//       <div className="dashboard-middle">

//         {/* Left Side - India Map */}
//         <div className="india-map">
//           <IndiaMap />
//         </div>

//         {/* Right Side - Pyramid */}
//         <div className="dashboard-pyramid">
//           <svg viewBox="0 0 800 450" width="100%" height="100%">

//             {/* Triangles */}
//             <polygon points="400,30 200,230 600,230" fill="#90caf9" />
//             <polygon points="200,230 10,420 400,420" fill="#a5d6a7" />
//             <polygon points="200,230 600,230 400,420" fill="#f48fb1" />
//             <polygon points="600,230 400,420 790,420" fill="#b39ddb" />

//             {/* Dashboard */}
//             <Link to="/dashboard">
//               <ellipse
//                 cx="400"
//                 cy="145"
//                 rx="80"
//                 ry="28"
//                 fill="white"
//                 stroke="#dddddd"
//               />
//               <text
//                 x="400"
//                 y="151"
//                 textAnchor="middle"
//                 fontSize="15"
//                 fontWeight="600"
//               >
//                 Dashboard
//               </text>
//             </Link>

//             {/* Advance Booking */}
//             <Link to="/advance-booking">
//               <ellipse
//                 cx="210"
//                 cy="320"
//                 rx="75"
//                 ry="28"
//                 fill="white"
//                 stroke="#dddddd"
//               />
//               <text
//                 x="210"
//                 y="326"
//                 textAnchor="middle"
//                 fontSize="15"
//                 fontWeight="600"
//               >
//                 Advance
//               </text>
//             </Link>

//             {/* Login */}
//             <Link to="/login/national">
//               <ellipse
//                 cx="400"
//                 cy="295"
//                 rx="70"
//                 ry="28"
//                 fill="white"
//                 stroke="#dddddd"
//               />
//               <text
//                 x="400"
//                 y="301"
//                 textAnchor="middle"
//                 fontSize="15"
//                 fontWeight="600"
//               >
//                 Login
//               </text>
//             </Link>

//             {/* FAQs */}
//             <Link to="/faqs">
//               <ellipse
//                 cx="590"
//                 cy="320"
//                 rx="75"
//                 ry="28"
//                 fill="white"
//                 stroke="#dddddd"
//               />
//               <text
//                 x="590"
//                 y="326"
//                 textAnchor="middle"
//                 fontSize="15"
//                 fontWeight="600"
//               >
//                 FAQs
//               </text>
//             </Link>

//           </svg>
//         </div>

//       </div>

//       {/* Dashboard Statistics */}
//       <section className="stats-section">

//         <div className="section-title">
//           <span>DASHBOARD</span>
//           <h2>Dashboard Statistics</h2>
//           <p>
//             Statistics and analytics of the Harit SANKALP Portal.
//           </p>
//         </div>

//         <div className="stats-grid">

//           <div className="dashboard-card card-gray">
//             <div className="card-body">
//               <p className="card-title">Total number of States Onboarded</p>
//               <h3 className="card-value">15</h3>
//             </div>
//             <a href="#" className="card-footer">
//               View Details <span>&#10095;</span>
//             </a>
//           </div>

//           <div className="dashboard-card card-green">
//             <div className="card-body">
//               <p className="card-title">Total number of Nurseries across the Nation</p>
//               <h3 className="card-value">867</h3>
//             </div>
//             <a href="#" className="card-footer">
//               View Details <span>&#10095;</span>
//             </a>
//           </div>

//           <div className="dashboard-card card-pink">
//             <div className="card-body">
//               <p className="card-title">Total number Species available for distribution</p>
//               <h3 className="card-value">0</h3>
//             </div>
//             <a href="#" className="card-footer">
//               View Details <span>&#10095;</span>
//             </a>
//           </div>

//           <div className="dashboard-card card-blue">
//             <div className="card-body">
//               <p className="card-title">Total seedlings available for distribution</p>
//               <h3 className="card-value">0</h3>
//             </div>
//             <a href="#" className="card-footer">
//               View Details <span>&#10095;</span>
//             </a>
//           </div>

//           <div className="dashboard-card card-teal">
//             <div className="card-body">
//               <p className="card-title">Seed Production Area/ Candidate Plus Tree</p>
//               <h3 className="card-value">0</h3>
//             </div>
//             <a href="#" className="card-footer">
//               View Details <span>&#10095;</span>
//             </a>
//           </div>

//           <div className="dashboard-card card-red">
//             <div className="card-body">
//               <p className="card-title">Seed Orchard</p>
//               <h3 className="card-value">0</h3>
//             </div>
//             <a href="#" className="card-footer">
//               View Details <span>&#10095;</span>
//             </a>
//           </div>

//           <div className="dashboard-card card-lightgreen">
//             <div className="card-body">
//               <p className="card-title">Research Institute</p>
//               <h3 className="card-value">0</h3>
//             </div>
//             <a href="#" className="card-footer">
//               View Details <span>&#10095;</span>
//             </a>
//           </div>

//           <div className="dashboard-card card-orange">
//             <div className="card-body">
//               <p className="card-title">Seed Processing cum Treatment Unit</p>
//               <h3 className="card-value">0</h3>
//             </div>
//             <a href="#" className="card-footer">
//               View Details <span>&#10095;</span>
//             </a>
//           </div>

//         </div>

//       </section>

//       {/* Nursery Information */}
//       <section className="nursery-section">

//         <div className="section-title">
//           <span>NURSERY INFORMATION</span>
//           <h2>Forest Nursery Information</h2>
//           <p>
//             Explore nursery services, registrations and reports across India.
//           </p>
//         </div>

//         <div className="chart-filters">

//           <button className="filter-btn">State</button>

//           <button className="filter-btn">District</button>

//           {/* 3. Updated Species Button with onClick event */}
//           <button 
//             className="filter-btn" 
//             onClick={() => navigate('/species')}
//           >
//             Species
//           </button>

//           <button className="filter-btn">Height</button>

//           <button className="filter-btn filter-btn-green">
//             Filter
//           </button>

//           <button className="filter-btn filter-btn-red">
//             Reset
//           </button>

//         </div>

//       </section>

//       {/* Reports & Charts */}
//       <section className="chart-section">

//         <div className="section-title">
//           <span>ANALYTICS</span>
//           <h2>Reports & Charts</h2>
//           <p>
//             Visual insights showing nursery distribution and statistics across the country.
//           </p>
//         </div>
//         <DashboardCharts />
//       </section>
//     </div>
//   );
// }

// export default Dashboard;
// import React, { useState } from "react";
// import DashboardCharts from "../../components/Map/DashboardCharts";
// import IndiaMap from "../../components/Map/IndiaMap";
// import { Link, useNavigate } from "react-router-dom"; // 1. Added useNavigate import
// import "./Dashboard.css";
// import { Swiper, SwiperSlide } from "swiper/react";
// import { Navigation, Pagination, Autoplay } from "swiper/modules";

// import "swiper/css";
// import "swiper/css/navigation";
// import "swiper/css/pagination";

// import Banner_1 from "../../assets/images/Banner_1.jpg";
// import Banner_2 from "../../assets/images/Banner_2.jpg";
// import Banner_3 from "../../assets/images/Banner_3.jpg";
// import Banner_4 from "../../assets/images/Banner_4.jpeg";
// import Banner_5 from "../../assets/images/Banner_5.jpg";
// import Banner_6 from "../../assets/images/Banner_6.jpeg";

// // Helper function to split images into groups of 6
// const chunkArray = (arr, size) => {
//   const chunks = [];
//   for (let i = 0; i < arr.length; i += size) {
//     chunks.push(arr.slice(i, i + size));
//   }
//   return chunks;
// };

// function Dashboard() {
//   const navigate = useNavigate(); // 2. Initialize useNavigate hook
//   const [activeTab, setActiveTab] = useState("dashboard");

//   const carouselImages = [
//     { id: 1, src: Banner_1, alt: "Harit Sankalp Banner 1" },
//     { id: 2, src: Banner_2, alt: "Harit Sankalp Banner 2" },
//     { id: 3, src: Banner_3, alt: "Harit Sankalp Banner 3" },
//     { id: 4, src: Banner_4, alt: "Harit Sankalp Banner 4" },
//     { id: 5, src: Banner_5, alt: "Harit Sankalp Banner 5" },
//     { id: 6, src: Banner_6, alt: "Harit Sankalp Banner 6" },
//   ];

//   const imageGroups = chunkArray(carouselImages, 6);

//   const sidebarMenuItems = [
//    {
//       id: "home",
//       label: "Home",
//       path: "/",
//       icon: (
//         <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//           <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
//           <polyline points="9 22 9 12 15 12 15 22" />
//         </svg>
//       ),
//     },
//     {
//       id: "states",
//       label: "Total number of States Onboarded",
//       path: "/states",
//       icon: (
//         <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//           <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
//           <circle cx="12" cy="10" r="3" />
//         </svg>
//       ),
//     },
//     {
//       id: "nurseries",
//       label: "Total number of Nurseries across the Nation",
//       path: "/nurseries",
//       icon: (
//         <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//           <path d="M12 10a6 6 0 0 0-6-6H4v2a6 6 0 0 0 6 6h2z" />
//           <path d="M12 10a6 6 0 0 1 6-6h2v2a6 6 0 0 1-6 6h-2z" />
//           <path d="M12 10v12" />
//         </svg>
//       ),
//     },
//     {
//       id: "species",
//       label: "Total number Species available for distribution",
//       path: "/species",
//       icon: (
//         <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//           <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.1 2 9 0 4.97-4.03 9-9 9z" />
//           <path d="M12 20v-8" />
//         </svg>
//       ),
//     },
//     {
//       id: "seedlings",
//       label: "Total seedlings available for distribution",
//       path: "/seedlings",
//       icon: (
//         <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//           <path d="M12 10a6 6 0 0 0-6-6H4v2a6 6 0 0 0 6 6h2z" />
//           <path d="M12 14a6 6 0 0 1 6-6h2v2a6 6 0 0 1-6 6h-2z" />
//           <path d="M12 10v12" />
//         </svg>
//       ),
//     },
//     {
//       id: "cpt",
//       label: "Seed Production Area/ Candidate Plus Tree",
//       path: "/cpt",
//       icon: (
//         <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//           <path d="M12 19V5" />
//           <path d="M5 12l7-7 7 7" />
//           <path d="M5 19l7-7 7 7" />
//         </svg>
//       ),
//     },
//     {
//       id: "orchard",
//       label: "Seed Orchard",
//       path: "/orchard",
//       icon: (
//         <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//           <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.1 2 9 0 4.97-4.03 9-9 9z" />
//           <path d="M12 20v-8" />
//         </svg>
//       ),
//     },
//     {
//       id: "research",
//       label: "Research Institute",
//       path: "/research",
//       icon: (
//         <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//           <path d="M10 2v7.31L4.75 18.1a2 2 0 0 0 1.69 2.9h11.12a2 2 0 0 0 1.69-2.9L14 9.31V2" />
//           <path d="M8.5 2h7" />
//           <path d="M7 16h10" />
//         </svg>
//       ),
//     },
//     {
//       id: "treatment",
//       label: "Seed Processing cum Treatment Unit",
//       path: "/treatment",
//       icon: (
//         <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//           <path d="M3 21h18" />
//           <path d="M5 21V7l8 4V7l8 4v10" />
//           <path d="M17 14h.01" />
//           <path d="M17 17h.01" />
//         </svg>
//       ),
//     },
//   ];
//   const cardsData = [
//     {
//       id: 1,
//       theme: "card-theme-states",
//       category: "Overview",
//       title: "Total number of States Onboarded",
//       value: "15",
//       icon: (
//         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//           <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 9 0 0 1 18 0z" />
//           <circle cx="12" cy="10" r="3" />
//         </svg>
//       ),
//     },
//     {
//       id: 2,
//       theme: "card-theme-nurseries",
//       category: "Active",
//       title: "Total number of Nurseries across Nation",
//       value: "867",
//       icon: (
//         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//           <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
//         </svg>
//       ),
//     },
//     {
//       id: 3,
//       theme: "card-theme-species",
//       category: "Inventory",
//       title: "Total number Species available",
//       value: "0",
//       icon: (
//         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//           <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.1 2 9 0 4.97-4.03 9-9 9z" />
//           <path d="M12 20v-8" />
//         </svg>
//       ),
//     },
//     {
//       id: 4,
//       theme: "card-theme-seedlings",
//       category: "Distribution",
//       title: "Total seedlings available",
//       value: "0",
//       icon: (
//         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//           <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
//         </svg>
//       ),
//     },
//     {
//       id: 5,
//       theme: "card-theme-production",
//       category: "Forestry",
//       title: "Seed Production Area / CPT",
//       value: "0",
//       icon: (
//         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//           <path d="M12 2L2 22h20L12 2z" />
//           <path d="M12 10v6" />
//         </svg>
//       ),
//     },
//     {
//       id: 6,
//       theme: "card-theme-orchard",
//       category: "Cultivation",
//       title: "Seed Orchard",
//       value: "0",
//       icon: (
//         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//           <circle cx="12" cy="12" r="10" />
//           <path d="M8 12a4 4 0 0 0 8 0" />
//         </svg>
//       ),
//     },
//     {
//       id: 7,
//       theme: "card-theme-institute",
//       category: "Research",
//       title: "Research Institute",
//       value: "0",
//       icon: (
//         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//           <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
//           <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
//         </svg>
//       ),
//     },
//     {
//       id: 8,
//       theme: "card-theme-treatment",
//       category: "Facility",
//       title: "Seed Processing Unit",
//       value: "0",
//       icon: (
//         <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
//           <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
//         </svg>
//       ),
//     },
//   ];

//   return (
//     <div className="dashboard-main-wrapper">
//       {/* Sidebar Navigation */}
//       <aside className="left-sidebar">
//         <div className="sidebar-brand-header">
//           <div className="brand-icon-box">
//             <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#27d07d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//               <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.1 2 9 0 4.97-4.03 9-9 9z" />
//               <path d="M12 20v-8" />
//             </svg>
//           </div>
//           <div className="brand-text-box">
//             <h2>Smart Forestry</h2>
//             <p>Harit-SANKALP</p>
//           </div>
//         </div>
//         <div className="sidebar-menu-list">
//           {sidebarMenuItems.map((item) => (
//             <div
//               key={item.id}
//               className={`sidebar-menu-item ${activeTab === item.id ? "active" : ""}`}
//               onClick={() => {
//                 setActiveTab(item.id);
//                 if (item.path) navigate(item.path);
//               }}
//             >
//               <span className="sidebar-item-icon">{item.icon}</span>
//               <span className="sidebar-item-text">{item.label}</span>
//             </div>
//           ))}
//         </div>
//       </aside>

//       {/* Main Dashboard Container */}
//       <div className="dashboard">
//         {/* Carousel Section */}
//         <section className="carousel-section">
          
//           <div className="dashboard-header-text">
//             <span className="overview-subheading">OVERVIEW</span>
//             <h1 className="overview-heading">Dashboard</h1>
//           </div>

//           <Swiper
//             modules={[Navigation, Pagination, Autoplay]}
//             slidesPerView={3}
//             spaceBetween={24}
//             navigation
//             pagination={{ clickable: true }}
//             autoplay={{ delay: 4000, disableOnInteraction: false }}
//             loop={true}
//             breakpoints={{
//               320: { slidesPerView: 1, spaceBetween: 12 },
//               768: { slidesPerView: 2, spaceBetween: 16 },
//               1024: { slidesPerView: 3, spaceBetween: 24 },
//             }}
//           >
//             {carouselImages.map((image) => (
//               <SwiperSlide key={image.id}>
//                 <div className="single-card">
//                   <img src={image.src} alt={image.alt} />
//                 </div>
//               </SwiperSlide>
//             ))}
//           </Swiper>
//         </section>
//         {/* India Map & Quick Access Section */}
//         <div className="dashboard-middle">

//           {/* Left Side - India Map */}
//           <div className="india-map-wrapper">
//             <div className="map-header-bar">
//               <span className="section-sub-label">MAP VIEW</span>
//               <div className="map-title-row">
//                 <h3 className="map-main-title">Total number of Registered Nurseries</h3>
//                 <span className="state-badge">State-wise</span>
//               </div>
//             </div>
//             <div className="india-map">
//               <IndiaMap />
//             </div>
//           </div>

//           {/* Right Side - Pyramid / Quick Access */}
//           <div className="quick-access-wrapper">
//             <h3 className="quick-access-title">Quick Access</h3>
//             <div className="dashboard-pyramid">
//               <svg viewBox="0 0 800 450" width="100%" height="100%">

//                 {/* Triangles */}
//                 <polygon points="400,30 200,230 600,230" fill="#90caf9" />
//                 <polygon points="200,230 10,420 400,420" fill="#a5d6a7" />
//                 <polygon points="200,230 600,230 400,420" fill="#f48fb1" />
//                 <polygon points="600,230 400,420 790,420" fill="#b39ddb" />

//                 {/* Dashboard */}
//                 <Link to="/dashboard">
//                   <ellipse
//                     cx="400"
//                     cy="145"
//                     rx="80"
//                     ry="28"
//                     fill="white"
//                     stroke="#dddddd"
//                   />
//                   <text
//                     x="400"
//                     y="151"
//                     textAnchor="middle"
//                     fontSize="15"
//                     fontWeight="600"
//                   >
//                     Dashboard
//                   </text>
//                 </Link>

//                 {/* Advance Booking */}
//                 <Link to="/advance-booking">
//                   <ellipse
//                     cx="210"
//                     cy="320"
//                     rx="75"
//                     ry="28"
//                     fill="white"
//                     stroke="#dddddd"
//                   />
//                   <text
//                     x="210"
//                     y="326"
//                     textAnchor="middle"
//                     fontSize="15"
//                     fontWeight="600"
//                   >
//                     Advance
//                   </text>
//                 </Link>

//                 {/* Login */}
//                 <Link to="/login/national">
//                   <ellipse
//                     cx="400"
//                     cy="295"
//                     rx="70"
//                     ry="28"
//                     fill="white"
//                     stroke="#dddddd"
//                   />
//                   <text
//                     x="400"
//                     y="301"
//                     textAnchor="middle"
//                     fontSize="15"
//                     fontWeight="600"
//                   >
//                     Login
//                   </text>
//                 </Link>

//                 {/* FAQs */}
//                 <Link to="/faqs">
//                   <ellipse
//                     cx="590"
//                     cy="320"
//                     rx="75"
//                     ry="28"
//                     fill="white"
//                     stroke="#dddddd"
//                   />
//                   <text
//                     x="590"
//                     y="326"
//                     textAnchor="middle"
//                     fontSize="15"
//                     fontWeight="600"
//                   >
//                     FAQs
//                   </text>
//                 </Link>

//               </svg>
//             </div>
//           </div>

//         </div>


//        {/* Statistics Cards Section */}
//         <section className="stats-section">
//           <div className="section-title">
//             <span>DASHBOARD</span>
//             <h2>Dashboard Statistics</h2>
//             <p>Statistics and analytics of the Harit SANKALP Portal.</p>
//           </div>

//           <div className="stats-carousel-wrapper">
//         <Swiper
//           modules={[Navigation, Pagination, Autoplay]}
//           spaceBetween={16}
//           slidesPerView={4}
//           navigation
//           pagination={{ clickable: true }}
//           autoplay={{ delay: 3500, disableOnInteraction: false }}
//           breakpoints={{
//             320: { slidesPerView: 1, spaceBetween: 10 },
//             640: { slidesPerView: 2, spaceBetween: 12 },
//             1024: { slidesPerView: 3, spaceBetween: 14 },
//             1280: { slidesPerView: 4, spaceBetween: 16 },
//           }}
//           className="stats-swiper"
//         >
//           {cardsData.map((card) => (
//             <SwiperSlide key={card.id}>
//               <div className={`compact-stat-card ${card.theme}`}>
//                 <div className="compact-card-top">
//                   <div className="compact-icon-wrapper">{card.icon}</div>
//                   <span className="compact-category">{card.category}</span>
//                 </div>
//                 <div className="compact-card-body">
//                   <h4 className="compact-card-title">{card.title}</h4>
//                   <p className="compact-card-value">{card.value}</p>
//                 </div>
//                 <a href="#details" className="compact-card-footer">
//                   <span>View Details</span>
//                   <span className="footer-arrow">→</span>
//                 </a>
//               </div>
//             </SwiperSlide>
//           ))}
//         </Swiper>
//       </div>
//       </section>

//         {/* Nursery Information */}
//         <section className="nursery-section">

//           <div className="section-title">
//             <span>NURSERY INFORMATION</span>
//             <h2>Forest Nursery Information</h2>
//             <p>
//               Explore nursery services, registrations and reports across India.
//             </p>
//           </div>

//           <div className="chart-filters">

//             <button className="filter-btn">State</button>

//             <button className="filter-btn">District</button>

//             {/* 3. Updated Species Button with onClick event */}
//             <button 
//               className="filter-btn" 
//               onClick={() => navigate('/species')}
//             >
//               Species
//             </button>

//             <button className="filter-btn">Height</button>

//             <button className="filter-btn filter-btn-green">
//               Filter
//             </button>

//             <button className="filter-btn filter-btn-red">
//               Reset
//             </button>

//           </div>

//         </section>

//         {/* Reports & Charts */}
//         <section className="chart-section">

//           <div className="section-title">
//             <span>ANALYTICS</span>
//             <h2>Reports & Charts</h2>
//             <p>
//               Visual insights showing nursery distribution and statistics across the country.
//             </p>
//           </div>
//           <DashboardCharts />
//         </section>
//       </div>
//     </div>
//   );
// }

// export default Dashboard;
import React, { useState } from "react";
import DashboardCharts from "../../components/Map/DashboardCharts";
import IndiaMap from "../../components/Map/IndiaMap";
import { Link, useNavigate } from "react-router-dom";
import "./Dashboard.css";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import Banner_1 from "../../assets/images/Banner_1.jpg";
import Banner_2 from "../../assets/images/Banner_2.jpg";
import Banner_3 from "../../assets/images/Banner_3.jpg";
import Banner_4 from "../../assets/images/Banner_4.jpeg";
import Banner_5 from "../../assets/images/Banner_5.jpg";
import Banner_6 from "../../assets/images/Banner_6.jpeg";

function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  const carouselImages = [
    { id: 1, src: Banner_1, alt: "Harit Sankalp Banner 1" },
    { id: 2, src: Banner_2, alt: "Harit Sankalp Banner 2" },
    { id: 3, src: Banner_3, alt: "Harit Sankalp Banner 3" },
    { id: 4, src: Banner_4, alt: "Harit Sankalp Banner 4" },
    { id: 5, src: Banner_5, alt: "Harit Sankalp Banner 5" },
    { id: 6, src: Banner_6, alt: "Harit Sankalp Banner 6" },
  ];

  const sidebarMenuItems = [
    {
      id: "home",
      label: "Home",
      path: "/",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      id: "states",
      label: "Total number of States Onboarded",
      path: "/states",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
    },
    {
      id: "nurseries",
      label: "Total number of Nurseries across the Nation",
      path: "/nurseries",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 10a6 6 0 0 0-6-6H4v2a6 6 0 0 0 6 6h2z" />
          <path d="M12 10a6 6 0 0 1 6-6h2v2a6 6 0 0 1-6 6h-2z" />
          <path d="M12 10v12" />
        </svg>
      ),
    },
    {
      id: "species",
      label: "Total number Species available for distribution",
      path: "/species",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.1 2 9 0 4.97-4.03 9-9 9z" />
          <path d="M12 20v-8" />
        </svg>
      ),
    },
    {
      id: "seedlings",
      label: "Total seedlings available for distribution",
      path: "/seedlings",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 10a6 6 0 0 0-6-6H4v2a6 6 0 0 0 6 6h2z" />
          <path d="M12 14a6 6 0 0 1 6-6h2v2a6 6 0 0 1-6 6h-2z" />
          <path d="M12 10v12" />
        </svg>
      ),
    },
    {
      id: "cpt",
      label: "Seed Production Area/ Candidate Plus Tree",
      path: "/cpt",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 19V5" />
          <path d="M5 12l7-7 7 7" />
          <path d="M5 19l7-7 7 7" />
        </svg>
      ),
    },
    {
      id: "orchard",
      label: "Seed Orchard",
      path: "/orchard",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.1 2 9 0 4.97-4.03 9-9 9z" />
          <path d="M12 20v-8" />
        </svg>
      ),
    },
    {
      id: "research",
      label: "Research Institute",
      path: "/research",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2v7.31L4.75 18.1a2 2 0 0 0 1.69 2.9h11.12a2 2 0 0 0 1.69-2.9L14 9.31V2" />
          <path d="M8.5 2h7" />
          <path d="M7 16h10" />
        </svg>
      ),
    },
    {
      id: "treatment",
      label: "Seed Processing cum Treatment Unit",
      path: "/treatment",
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 21h18" />
          <path d="M5 21V7l8 4V7l8 4v10" />
          <path d="M17 14h.01" />
          <path d="M17 17h.01" />
        </svg>
      ),
    },
  ];

  const cardsData = [
    {
      id: 1,
      category: "Overview",
      title: "Total number of States Onboarded",
      value: "15",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
    },
    {
      id: 2,
      category: "Active",
      title: "Total number of Nurseries across Nation",
      value: "867",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      ),
    },
    {
      id: 3,
      category: "Inventory",
      title: "Total number Species available",
      value: "0",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.1 2 9 0 4.97-4.03 9-9 9z" />
          <path d="M12 20v-8" />
        </svg>
      ),
    },
    {
      id: 4,
      category: "Distribution",
      title: "Total seedlings available",
      value: "0",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      ),
    },
    {
      id: 5,
      category: "Forestry",
      title: "Seed Production Area / CPT",
      value: "0",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 22h20L12 2z" />
          <path d="M12 10v6" />
        </svg>
      ),
    },
    {
      id: 6,
      category: "Cultivation",
      title: "Seed Orchard",
      value: "0",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 12a4 4 0 0 0 8 0" />
        </svg>
      ),
    },
    {
      id: 7,
      category: "Research",
      title: "Research Institute",
      value: "0",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      ),
    },
    {
      id: 8,
      category: "Facility",
      title: "Seed Processing Unit",
      value: "0",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      ),
    },
  ];

  return (
    <div className="dashboard-main-wrapper">
      {/* Sidebar Navigation */}
      <aside className="left-sidebar">
        <div className="sidebar-brand-header">
          <div className="brand-icon-box">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#27d07d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.4 19 2c1 2 2 4.1 2 9 0 4.97-4.03 9-9 9z" />
              <path d="M12 20v-8" />
            </svg>
          </div>
          <div className="brand-text-box">
            <h2>Smart Forestry</h2>
            <p>Harit-SANKALP</p>
          </div>
        </div>
        <div className="sidebar-menu-list">
          {sidebarMenuItems.map((item) => (
            <div
              key={item.id}
              className={`sidebar-menu-item ${activeTab === item.id ? "active" : ""}`}
              onClick={() => {
                setActiveTab(item.id);
                if (item.path) navigate(item.path);
              }}
            >
              <span className="sidebar-item-icon">{item.icon}</span>
              <span className="sidebar-item-text">{item.label}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* Main Dashboard Container */}
      <div className="dashboard">
        {/* Banner Carousel Section */}
        <section className="carousel-section">
          <div className="dashboard-header-text">
            <span className="overview-subheading">OVERVIEW</span>
            <h1 className="overview-heading">Dashboard</h1>
          </div>

          <Swiper
            modules={[Navigation, Pagination, Autoplay]}
            slidesPerView={3}
            spaceBetween={24}
            navigation
            pagination={{ clickable: true }}
            autoplay={{ delay: 4000, disableOnInteraction: false }}
            loop={true}
            breakpoints={{
              320: { slidesPerView: 1, spaceBetween: 12 },
              768: { slidesPerView: 2, spaceBetween: 16 },
              1024: { slidesPerView: 3, spaceBetween: 24 },
            }}
          >
            {carouselImages.map((image) => (
              <SwiperSlide key={image.id}>
                <div className="single-card">
                  <img src={image.src} alt={image.alt} />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </section>

        {/* Map & Quick Access */}
        <div className="dashboard-middle">
          <div className="india-map-wrapper">
            <div className="map-header-bar">
              <span className="section-sub-label">MAP VIEW</span>
              <div className="map-title-row">
                <h3 className="map-main-title">Total number of Registered Nurseries</h3>
                <span className="state-badge">State-wise</span>
              </div>
            </div>
            <div className="india-map">
              <IndiaMap />
            </div>
          </div>

          <div className="quick-access-wrapper">
            <h3 className="quick-access-title">Quick Access</h3>
            <div className="dashboard-pyramid">
              <svg viewBox="0 0 800 450" width="100%" height="100%">
                <polygon points="400,30 200,230 600,230" fill="#90caf9" />
                <polygon points="200,230 10,420 400,420" fill="#a5d6a7" />
                <polygon points="200,230 600,230 400,420" fill="#f48fb1" />
                <polygon points="600,230 400,420 790,420" fill="#b39ddb" />

                <Link to="/dashboard">
                  <ellipse cx="400" cy="145" rx="80" ry="28" fill="white" stroke="#dddddd" />
                  <text x="400" y="151" textAnchor="middle" fontSize="15" fontWeight="600">Dashboard</text>
                </Link>

                <Link to="/advance-booking">
                  <ellipse cx="210" cy="320" rx="75" ry="28" fill="white" stroke="#dddddd" />
                  <text x="210" y="326" textAnchor="middle" fontSize="15" fontWeight="600">Advance</text>
                </Link>

                <Link to="/login/national">
                  <ellipse cx="400" cy="295" rx="70" ry="28" fill="white" stroke="#dddddd" />
                  <text x="400" y="301" textAnchor="middle" fontSize="15" fontWeight="600">Login</text>
                </Link>

                <Link to="/faqs">
                  <ellipse cx="590" cy="320" rx="75" ry="28" fill="white" stroke="#dddddd" />
                  <text x="590" y="326" textAnchor="middle" fontSize="15" fontWeight="600">FAQs</text>
                </Link>
              </svg>
            </div>
          </div>
        </div>

        {/* Statistics Cards Carousel Section */}
        <section className="stats-section">
          <div className="section-title">
            <span>DASHBOARD</span>
            <h2>Dashboard Statistics</h2>
            <p>Statistics and analytics of the Harit SANKALP Portal.</p>
          </div>

          <div className="stats-carousel-container">
            <Swiper
              modules={[Navigation, Pagination, Autoplay]}
              spaceBetween={16}
              slidesPerView={4}
              navigation={true}
              pagination={{ clickable: true }}
              autoplay={{ delay: 3500, disableOnInteraction: false }}
              breakpoints={{
                320: { slidesPerView: 1, spaceBetween: 10 },
                640: { slidesPerView: 2, spaceBetween: 12 },
                992: { slidesPerView: 3, spaceBetween: 14 },
                1200: { slidesPerView: 4, spaceBetween: 16 },
              }}
              className="stats-swiper"
            >
              {cardsData.map((card) => (
                <SwiperSlide key={card.id}>
                  <div className="stat-card">
                    <div className="stat-card-header">
                      <div className="stat-icon-box">{card.icon}</div>
                      <span className="stat-tag">{card.category}</span>
                    </div>

                    <div className="stat-card-body">
                      <p className="stat-card-title">{card.title}</p>
                      <h3 className="stat-card-value">{card.value}</h3>
                    </div>

                    <a href="#details" className="stat-card-link">
                      <span>View Details</span>
                      <span className="stat-arrow">→</span>
                    </a>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </section>

        {/* Nursery Filters & Information */}
        <section className="nursery-section">
          <div className="section-title">
            <span>NURSERY INFORMATION</span>
            <h2>Forest Nursery Information</h2>
            <p>Explore nursery services, registrations and reports across India.</p>
          </div>

          <div className="chart-filters">
            <button className="filter-btn">State</button>
            <button className="filter-btn">District</button>
            <button className="filter-btn" onClick={() => navigate("/species")}>Species</button>
            <button className="filter-btn">Height</button>
            <button className="filter-btn filter-btn-green">Filter</button>
            <button className="filter-btn filter-btn-red">Reset</button>
          </div>
        </section>

        {/* Reports & Charts Section */}
        <section className="chart-section">
          <div className="section-title">
            <span>ANALYTICS</span>
            <h2>Reports & Charts</h2>
            <p>Visual insights showing nursery distribution and statistics across the country.</p>
          </div>
          <DashboardCharts />
        </section>
      </div>
    </div>
  );
}

export default Dashboard;