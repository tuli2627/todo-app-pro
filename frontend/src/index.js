import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
// import React, { Suspense } from 'react'; // 1. Import Suspense
// import ReactDOM from 'react-dom/client';
// import App from './App';
// import './index.css';
// import './i18n'; // 2. Import your i18n configuration here!

// // 3. Create a simple loading screen for the split-second it takes to fetch translations
// const Loader = () => (
//   <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#0e4736' }}>
//     <h3>Loading...</h3>
//   </div>
// );

// const root = ReactDOM.createRoot(document.getElementById('root'));
// root.render(
//   <React.StrictMode>
//     {/* 4. Wrap the App component in Suspense */}
//     <Suspense fallback={<Loader />}>
//       <App />
//     </Suspense>
//   </React.StrictMode>
// );