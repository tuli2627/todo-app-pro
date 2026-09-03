import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api";

const SpeciesPage = () => {
  const navigate = useNavigate();
  const [speciesList, setSpeciesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    // Fetches the data queried from [dbOSTPM].[dbo].[M007_Species]
    axios
      .get(`${API_BASE_URL}/species/`)
      .then((res) => {
        setSpeciesList(res.data || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching species data:", err);
        setLoading(false);
      });
  }, []);

  const filteredSpecies = speciesList.filter(
    (item) =>
      item.Species_Name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.Species_S_Name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ maxWidth: "1200px", margin: "20px auto", padding: "20px", fontFamily: "Arial, sans-serif" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "8px 16px",
            backgroundColor: "#2e7d32",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          ← Back
        </button>
        <h2 style={{ color: "#0f382c", margin: 0 }}>M007 Species Directory</h2>
        <input
          type="text"
          placeholder="Search species..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: "6px", width: "250px" }}
        />
      </div>

      {/* Database Table */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>Loading database records...</div>
      ) : (
        <div style={{ overflowX: "auto", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", borderRadius: "8px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", backgroundColor: "#fff" }}>
            <thead>
              <tr style={{ backgroundColor: "#2e7d32", color: "#fff", textAlign: "left" }}>
                <th style={{ padding: "12px", width: "80px" }}>Species ID</th>
                <th style={{ padding: "12px" }}>Species Name (Common)</th>
                <th style={{ padding: "12px" }}>Scientific Name</th>
                <th style={{ padding: "12px", textAlign: "center" }}>Active</th>
                <th style={{ padding: "12px" }}>Entry Date</th>
                <th style={{ padding: "12px" }}>POWO Link</th>
              </tr>
            </thead>
            <tbody>
              {filteredSpecies.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: "center", padding: "20px", color: "#888" }}>
                    No species records found.
                  </td>
                </tr>
              ) : (
                filteredSpecies.map((item, index) => (
                  <tr
                    key={item.Species_ID || index}
                    style={{
                      borderBottom: "1px solid #e0e0e0",
                      backgroundColor: index % 2 === 0 ? "#ffffff" : "#f9fbf9",
                    }}
                  >
                    <td style={{ padding: "10px 12px", fontWeight: "bold" }}>{item.Species_ID}</td>
                    <td style={{ padding: "10px 12px" }}>{item.Species_Name || "N/A"}</td>
                    <td style={{ padding: "10px 12px", fontStyle: "italic", color: "#2e7d32" }}>
                      {item.Species_S_Name || "N/A"}
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                      <span
                        style={{
                          padding: "3px 10px",
                          borderRadius: "12px",
                          fontSize: "11px",
                          backgroundColor: item.Species_Active === "Y" ? "#e8f5e9" : "#ffebee",
                          color: item.Species_Active === "Y" ? "#2e7d32" : "#c62828",
                          fontWeight: "bold",
                        }}
                      >
                        {item.Species_Active === "Y" ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "#666" }}>
                      {item.Species_EntryOn ? new Date(item.Species_EntryOn).toLocaleDateString() : "N/A"}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      {item.Species_POWO ? (
                        <a
                          href={item.Species_POWO}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: "#1565c0", textDecoration: "none", fontWeight: "bold" }}
                        >
                          View POWO ↗
                        </a>
                      ) : (
                        <span style={{ color: "#888", fontStyle: "italic" }}>N/A</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SpeciesPage;