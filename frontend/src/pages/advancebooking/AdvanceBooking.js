// // import React from 'react';
// // import './AdvanceBooking.css';

// // // Array containing the states shown in your screenshot
// // const indianStates = [
// //   "Andaman And Nicobar Islands",
// //   "Andhra Pradesh",
// //   "Arunachal Pradesh",
// //   "Assam",
// //   "Bihar",
// //   "Chandigarh",
// //   "Chhattisgarh",
// //   "Goa",
// //   "Gujarat",
// //   "Haryana",
// //   "Himachal Pradesh",
// //   "Jammu And Kashmir",
// //   "Jharkhand",
// //   "Karnataka",
// //   "Kerala",
// //   "Ladakh",
// //   "Lakshadweep",
// //   "Madhya Pradesh",
// //   "Maharashtra",
// //   // You can continue adding the rest of the Indian states here...
// // ];

// // function AdvanceBooking() {
// //   const handleSubmit = (e) => {
// //     e.preventDefault();
// //     // Logic to handle form submission will go here
// //     console.log("Form submitted");
// //   };

// //   return (
// //     <div className="adv-booking-container">
// //       <div className="floating-leaves">
// //         <span className="leaf">🍃</span>
// //         <span className="leaf">🌿</span>
// //         <span className="leaf">🍀</span>
// //         <span className="leaf">🍃</span>
// //       </div>
// //       <h2 className="adv-booking-title">Advance Booking Information</h2>

// //       <form onSubmit={handleSubmit}>
        
// //         {/* 1. Directory Details */}
// //         <div className="adv-form-section">
// //           <div className="adv-section-badge">1. Directory Details</div>
          
// //           <div className="adv-form-grid">
// //             <div className="adv-form-group">
// //               <label>State*</label>
// //               <select defaultValue="">
// //                 <option value="" disabled>Select State</option>
// //                 {indianStates.map((state, index) => (
// //                   <option key={index} value={state}>
// //                     {state}
// //                   </option>
// //                 ))}
// //               </select>
// //             </div>
// //             <div className="adv-form-group">
// //               <label>District*</label>
// //               <select><option>Select District</option></select>
// //             </div>
// //             <div className="adv-form-group">
// //               <label>Circle*</label>
// //               <select><option>Select Circle</option></select>
// //             </div>
// //             <div className="adv-form-group">
// //               <label>Forest Division*</label>
// //               <select><option>Select Forest Division</option></select>
// //             </div>
// //           </div>
// //         </div>

// //         {/* 2. Individual/ Private / Department Details */}
// //         <div className="adv-form-section">
// //           <div className="adv-section-badge">2. Individual/ Private / Department Details</div>
          
// //           <div className="adv-form-grid">
// //             <div className="adv-form-group">
// //               <label>Type*</label>
// //               <select><option>Select Type</option></select>
// //             </div>
// //             <div className="adv-form-group">
// //               <label>Name*</label>
// //               <input type="text" placeholder="Enter Name" />
// //             </div>
// //             <div className="adv-form-group">
// //               <label>Contact Person Name*</label>
// //               <input type="text" placeholder="Enter Name" />
// //             </div>
// //             <div className="adv-form-group">
// //               <label>Contact Person No*</label>
// //               <input type="text" placeholder="Enter Contact" />
// //             </div>
// //           </div>
// //         </div>

// //         {/* 3. Advance Booking Details */}
// //         <div className="adv-form-section">
// //           <div className="adv-section-badge">3. Advance Booking Details</div>
          
// //           <div className="adv-form-grid">
// //             <div className="adv-form-group">
// //               <label>Nursery Name*</label>
// //               <select><option>Select Name</option></select>
// //             </div>
// //             {/* Empty div to keep the grid aligned like the screenshot */}
// //             <div className="adv-form-group"></div> 

// //             <div className="adv-form-group">
// //               <label>Species*</label>
// //               <select><option>Select</option></select>
// //             </div>
// //             <div className="adv-form-group">
// //               <label>No. of Plants*</label>
// //               <input type="number" placeholder="In Numbers" />
// //             </div>
// //             <div className="adv-form-group">
// //               <label>Plant to be made available by*</label>
// //               <input type="date" />
// //             </div>
// //             <div className="adv-form-group">
// //               <label>Amount (INR)</label>
// //               <input type="number" placeholder="In INR" />
// //             </div>
// //           </div>
// //         </div>

// //        {/* 4. Upload Payment Receipt */}
// //         <div className="adv-form-section">
// //           <div className="adv-section-badge">4. Upload Payment Receipt</div>
          
// //           <div className="adv-upload-container">
// //             {/* Large Image Icon */}
// //             <div className="adv-image-icon">
// //               <svg viewBox="0 0 24 24" width="80" height="80" stroke="black" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
// //                 <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
// //                 <circle cx="8.5" cy="8.5" r="1.5"></circle>
// //                 <polyline points="21 15 16 10 5 21"></polyline>
// //               </svg>
// //             </div>

// //             {/* File Input and Warning Text */}
// //             <div className="adv-file-details">
// //               <div className="adv-file-input-row">
// //                 <span className="adv-required-star">*</span>
// //                 <input type="file" accept=".jpg, .jpeg" />
// //               </div>
// //               <div className="adv-warning-text">
// //                 <p>*Only *.jpg / *.jpeg format</p>
// //                 <p>Image size should be at least 50 KB</p>
// //               </div>
// //             </div>
// //           </div>
// //         </div>

// //         {/* Blue 'Book' Button Aligned to Right */}
// //         <div className="adv-submit-wrapper align-right">
// //             <button type="submit" className="adv-book-btn">Book</button>
// //         </div>
        
// //       </form>
// //     </div>
// //   );
// // }

// // export default AdvanceBooking;
// import React, { useState, useEffect } from 'react';
// import './AdvanceBooking.css';

// function AdvanceBooking() {
//   const [formData, setFormData] = useState({
//     state: '',
//     district: '',
//     circle: '',
//     forestDivision: '',
//     type: '',
//     name: '',
//     contactPersonName: '',
//     contactPersonNo: '',
//     nurseryName: '',
//     species: '',
//     noOfPlants: '',
//     availableDate: '',
//     amount: '',
//     receiptImage: '' 
//   });

//   const [statesList, setStatesList] = useState([]);
//   const [districtList, setDistrictList] = useState([]);
//   const [circleList, setCircleList] = useState([]);

//   // THIS FETCHES THE STATES FROM DJANGO
//   useEffect(() => {
//     fetch('http://127.0.0.1:8000/api/states/') 
//       .then(response => response.json())
//       .then(data => setStatesList(data))
//       .catch(error => console.error("Error fetching states:", error));
//   }, []);

//   // const handleStateChange = async (e) => {
//   //   const selectedStateId = e.target.value;
//   //   setFormData(prevState => ({
//   //     ...prevState,
//   //     state: selectedStateId,
//   //     district: '' 
//   //   }));
//   // };

//   // const handleInputChange = (e) => {
//   //   const { name, value } = e.target;
//   //   setFormData(prevState => ({
//   //     ...prevState,
//   //     [name]: value
//   //   }));
//   // };

//   // const handleFileChange = (e) => {
//   //   const file = e.target.files[0];
//   //   if (file) {
//   //     const reader = new FileReader();
//   //     reader.onloadend = () => {
//   //       setFormData(prevState => ({ ...prevState, receiptImage: reader.result }));
//   //     };
//   //     reader.readAsDataURL(file);
//   //   }
//   // };

//   // const handleSubmit = async (e) => {
//   //   e.preventDefault();
//   //   try {
//   //     const response = await fetch('http://127.0.0.1:8000/api/advance-booking/', {
//   //       method: 'POST',
//   //       headers: { 'Content-Type': 'application/json' },
//   //       body: JSON.stringify(formData)
//   //     });
//   //     if (response.ok) {
//   //       alert("Booking submitted successfully!");
//   //     } else {
//   //       alert("Failed to submit booking. Check server logs.");
//   //     }
//   //   } catch (error) {
//   //     alert("Error connecting to the server.");
//   //   }
//   // };
//   const handleStateChange = async (e) => {
//     const selectedStateId = e.target.value;
    
//     // 1. Update form data and reset district AND circle
//     setFormData(prevState => ({
//       ...prevState,
//       state: selectedStateId,
//       district: '',
//       circle: '' // <-- Added resetting circle here
//     }));

//     // 2. Fetch both districts and circles for the selected state
//     if (selectedStateId) {
//       try {
//         // Fetch Districts
//         const distResponse = await fetch(`http://127.0.0.1:8000/api/districts/?state_id=${selectedStateId}`);
//         const distData = await distResponse.json();
//         setDistrictList(distData);

//         // Fetch Circles
//         const circResponse = await fetch(`http://127.0.0.1:8000/api/circles/?state_id=${selectedStateId}`);
//         const circData = await circResponse.json();
//         setCircleList(circData);
//       } catch (error) {
//         console.error("Error fetching districts or circles:", error);
//       }
//     } else {
//       setDistrictList([]);
//       setCircleList([]); // <-- Added clearing circles here
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prevState => ({
//       ...prevState,
//       [name]: value
//     }));
//   };

//   const handleFileChange = (e) => {
//     const file = e.target.files[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setFormData(prevState => ({ ...prevState, receiptImage: reader.result }));
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await fetch('http://127.0.0.1:8000/api/advance-booking/', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(formData)
//       });
//       if (response.ok) {
//         alert("Booking submitted successfully!");
//       } else {
//         alert("Failed to submit booking. Check server logs.");
//       }
//     } catch (error) {
//       alert("Error connecting to the server.");
//     }
//   };

//   return (
//     <div className="adv-booking-container">
//       <div className="floating-leaves">
//         <span className="leaf">🍃</span><span className="leaf">🌿</span><span className="leaf">🍀</span><span className="leaf">🍃</span>
//       </div>
//       <h2 className="adv-booking-title">Advance Booking Information</h2>

//       <form onSubmit={handleSubmit}>
        
//         <div className="adv-form-section">
//           <div className="adv-section-badge">1. Directory Details</div>
//           <div className="adv-form-grid">
            
//             <div className="adv-form-group">
//               <label>State*</label>
//               <select name="state" value={formData.state} onChange={handleStateChange} required>
//                 <option value="" disabled>Select State</option>
//                 {/* THIS PUTS THE STATES IN THE DROPDOWN */}
//                 {statesList.map((stateObj) => (
//                   <option key={stateObj.state_id} value={stateObj.state_id}>
//                     {stateObj.state_name}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div className="adv-form-group">
//               <label>District*</label>
//               <select name="district" value={formData.district} onChange={handleInputChange} disabled={!formData.state} required>
//                   <option value="">Select District</option>
                  
//                   {/* Loop through the filtered district list from Django */}
//                   {districtList.map((distObj) => (
//                     <option key={distObj.district_id} value={distObj.district_id}>
//                       {distObj.district_name}
//                     </option>
//                   )}
                  
//                   {circleList.map((circObj) => (
//                     <option key={circObj.circle_id} value={circObj.circle_id}>
//                       {circObj.circle_name}
//                     </option>
//                   ))}
                  
//               </select>
//             </div>
            
//             {/* <div className="adv-form-group">
//               <label>District*</label>
//               <select name="district" value={formData.district} onChange={handleInputChange} disabled={!formData.state} required>
//                   <option value="">Select District</option>
//               </select>
//             </div> */}
//             <div className="adv-form-group">
//               <label>Circle*</label>
//               <select name="circle" value={formData.circle} onChange={handleInputChange}><option value="">Select Circle</option></select>
//             </div>
//             <div className="adv-form-group">
//               <label>Forest Division*</label>
//               <select name="forestDivision" value={formData.forestDivision} onChange={handleInputChange}><option value="">Select Forest Division</option></select>
//             </div>
//           </div>
//         </div>

//         <div className="adv-form-section">
//           <div className="adv-section-badge">2. Individual/ Private / Department Details</div>
//           <div className="adv-form-grid">
//             <div className="adv-form-group">
//               <label>Type*</label>
//               <select name="type" value={formData.type} onChange={handleInputChange} required>
//                   <option value="">Select Type</option>
//                   <option value="Individual">Individual</option>
//                   <option value="Private">Private</option>
//                   <option value="Department">Department</option>
//               </select>
//             </div>
//             <div className="adv-form-group"><label>Name*</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} required /></div>
//             <div className="adv-form-group"><label>Contact Person Name*</label><input type="text" name="contactPersonName" value={formData.contactPersonName} onChange={handleInputChange} required /></div>
//             <div className="adv-form-group"><label>Contact Person No*</label><input type="text" name="contactPersonNo" value={formData.contactPersonNo} onChange={handleInputChange} required /></div>
//           </div>
//         </div>

//         <div className="adv-form-section">
//           <div className="adv-section-badge">3. Advance Booking Details</div>
//           <div className="adv-form-grid">
//             <div className="adv-form-group"><label>Nursery Name*</label><select name="nurseryName" value={formData.nurseryName} onChange={handleInputChange} required><option value="">Select Name</option></select></div>
//             <div className="adv-form-group"></div> 
//             <div className="adv-form-group"><label>Species*</label><select name="species" value={formData.species} onChange={handleInputChange} required><option value="">Select</option></select></div>
//             <div className="adv-form-group"><label>No. of Plants*</label><input type="number" name="noOfPlants" value={formData.noOfPlants} onChange={handleInputChange} required /></div>
//             <div className="adv-form-group"><label>Plant to be made available by*</label><input type="date" name="availableDate" value={formData.availableDate} onChange={handleInputChange} required /></div>
//             <div className="adv-form-group"><label>Amount (INR)</label><input type="number" name="amount" value={formData.amount} onChange={handleInputChange} /></div>
//           </div>
//         </div>

//         <div className="adv-form-section">
//           <div className="adv-section-badge">4. Upload Payment Receipt</div>
//           <div className="adv-upload-container">
//             <div className="adv-image-icon">
//               <svg viewBox="0 0 24 24" width="80" height="80" stroke="black" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
//                 <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>
//               </svg>
//             </div>
//             <div className="adv-file-details">
//               <div className="adv-file-input-row"><span className="adv-required-star">*</span><input type="file" accept=".jpg, .jpeg" onChange={handleFileChange} required /></div>
//               <div className="adv-warning-text"><p>*Only *.jpg / *.jpeg format</p><p>Image size should be at least 50 KB</p></div>
//             </div>
//           </div>
//         </div>

//         <div className="adv-submit-wrapper align-right">
//             <button type="submit" className="adv-book-btn">Book</button>
//         </div>
//       </form>
//     </div>
//   );
// }

// export default AdvanceBooking;
import React, { useState, useEffect } from 'react';
import './AdvanceBooking.css';

function AdvanceBooking() {
  const [formData, setFormData] = useState({
    state: '',
    district: '',
    circle: '',
    forestDivision: '',
    type: '',
    name: '',
    contactPersonName: '',
    contactPersonNo: '',
    nurseryName: '',
    species: '',
    noOfPlants: '',
    availableDate: '',
    amount: '',
    receiptImage: '' 
  });

  const [statesList, setStatesList] = useState([]);
  const [districtList, setDistrictList] = useState([]);
  const [circleList, setCircleList] = useState([]); 
  const [divisionList, setDivisionList] = useState([]);

  // Fetch states when page loads
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/states/') 
      .then(response => response.json())
      .then(data => setStatesList(data))
      .catch(error => console.error("Error fetching states:", error));
  }, []);

  const handleStateChange = async (e) => {
    const selectedStateId = e.target.value;
    
    // Update form data and reset district AND circle
    setFormData(prevState => ({
      ...prevState,
      state: selectedStateId,
      district: '',
      circle: '' ,
      forestDivision: ''
    }));

    if (selectedStateId) {
      try {
        // Fetch Districts
        const distResponse = await fetch(`http://127.0.0.1:8000/api/districts/?state_id=${selectedStateId}`);
        const distData = await distResponse.json();
        setDistrictList(distData);

        // Fetch Circles
        const circResponse = await fetch(`http://127.0.0.1:8000/api/circles/?state_id=${selectedStateId}`);
        const circData = await circResponse.json();
        setCircleList(circData);
      } catch (error) {
        console.error("Error fetching districts or circles:", error);
      }
    } else {
      setDistrictList([]);
      setCircleList([]);
    }
    setDivisionList([]);
  };
  const handleCircleChange = async (e) => {
    const selectedCircleId = e.target.value;
    
    setFormData(prevState => ({
      ...prevState,
      circle: selectedCircleId,
      forestDivision: '' 
    }));

    if (selectedCircleId) {
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/divisions/?circle_id=${selectedCircleId}`);
        const data = await response.json();
        setDivisionList(data);
      } catch (error) {
        console.error("Error fetching divisions:", error);
      }
    } else {
      setDivisionList([]);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prevState => ({ ...prevState, receiptImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://127.0.0.1:8000/api/advance-booking/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        alert("Booking submitted successfully!");
      } else {
        alert("Failed to submit booking. Check server logs.");
      }
    } catch (error) {
      alert("Error connecting to the server.");
    }
  };

  return (
    <div className="adv-booking-container">
      <div className="floating-leaves">
        <span className="leaf">🍃</span><span className="leaf">🌿</span><span className="leaf">🍀</span><span className="leaf">🍃</span>
      </div>
      <h2 className="adv-booking-title">Advance Booking Information</h2>

      <form onSubmit={handleSubmit}>
        
        <div className="adv-form-section">
          <div className="adv-section-badge">1. Directory Details</div>
          <div className="adv-form-grid">
            
            {/* 1. STATE DROPDOWN */}
            <div className="adv-form-group">
              <label>State*</label>
              <select name="state" value={formData.state} onChange={handleStateChange} required>
                <option value="" disabled>Select State</option>
                {statesList.map((stateObj) => (
                  <option key={stateObj.state_id} value={stateObj.state_id}>
                    {stateObj.state_name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* 2. DISTRICT DROPDOWN */}
            <div className="adv-form-group">
              <label>District*</label>
              <select name="district" value={formData.district} onChange={handleInputChange} disabled={!formData.state} required>
                  <option value="">Select District</option>
                  {districtList.map((distObj) => (
                    <option key={distObj.district_id} value={distObj.district_id}>
                      {distObj.district_name}
                    </option>
                  ))}
              </select>
            </div>

            {/* 3. CIRCLE DROPDOWN */}
            <div className="adv-form-group">
              <label>Circle*</label>
              <select name="circle" value={formData.circle} onChange={handleCircleChange} disabled={!formData.state} required>
                  <option value="">Select Circle</option>
                  {circleList.map((circObj) => (
                    <option key={circObj.circle_id} value={circObj.circle_id}>
                      {circObj.circle_name}
                    </option>
                  ))}
              </select>
            </div>

            {/* 4. FOREST DIVISION DROPDOWN */}
            <div className="adv-form-group">
              <label>Forest Division*</label>
              <select name="forestDivision" value={formData.forestDivision} onChange={handleInputChange} disabled={!formData.circle} required>
                <option value="">Select Forest Division</option>
                {divisionList.map((divObj) => (
                  <option key={divObj.division_id} value={divObj.division_id}>
                    {divObj.division_name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="adv-form-section">
          <div className="adv-section-badge">2. Individual/ Private / Department Details</div>
          <div className="adv-form-grid">
            <div className="adv-form-group">
              <label>Type*</label>
              <select name="type" value={formData.type} onChange={handleInputChange} required>
                  <option value="">Select Type</option>
                  <option value="Individual">Individual</option>
                  <option value="Private">Private</option>
                  <option value="Department">Department</option>
                   
              </select>
            </div>
            <div className="adv-form-group"><label>Name*</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} required /></div>
            <div className="adv-form-group"><label>Contact Person Name*</label><input type="text" name="contactPersonName" value={formData.contactPersonName} onChange={handleInputChange} required /></div>
            <div className="adv-form-group"><label>Contact Person No*</label><input type="text" name="contactPersonNo" value={formData.contactPersonNo} onChange={handleInputChange} required /></div>
          </div>
        </div>

        <div className="adv-form-section">
          <div className="adv-section-badge">3. Advance Booking Details</div>
          <div className="adv-form-grid">
            <div className="adv-form-group"><label>Nursery Name*</label><select name="nurseryName" value={formData.nurseryName} onChange={handleInputChange} required><option value="">Select Name</option></select></div>
            <div className="adv-form-group"></div> 
            <div className="adv-form-group"><label>Species*</label><select name="species" value={formData.species} onChange={handleInputChange} required><option value="">Select</option></select></div>
            <div className="adv-form-group"><label>No. of Plants*</label><input type="number" name="noOfPlants" value={formData.noOfPlants} onChange={handleInputChange} required /></div>
            <div className="adv-form-group"><label>Plant to be made available by*</label><input type="date" name="availableDate" value={formData.availableDate} onChange={handleInputChange} required /></div>
            <div className="adv-form-group"><label>Amount (INR)</label><input type="number" name="amount" value={formData.amount} onChange={handleInputChange} /></div>
          </div>
        </div>

        <div className="adv-form-section">
          <div className="adv-section-badge">4. Upload Payment Receipt</div>
          <div className="adv-upload-container">
            <div className="adv-image-icon">
              <svg viewBox="0 0 24 24" width="80" height="80" stroke="black" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
            <div className="adv-file-details">
              <div className="adv-file-input-row"><span className="adv-required-star">*</span><input type="file" accept=".jpg, .jpeg" onChange={handleFileChange} required /></div>
              <div className="adv-warning-text"><p>*Only *.jpg / *.jpeg format</p><p>Image size should be at least 50 KB</p></div>
            </div>
          </div>
        </div>

        <div className="adv-submit-wrapper align-right">
            <button type="submit" className="adv-book-btn">Book</button>
        </div>
      </form>
    </div>
  );
}

export default AdvanceBooking;