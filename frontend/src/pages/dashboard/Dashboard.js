import DashboardCharts from "../../components/Map/DashboardCharts";
import IndiaMap from "../../components/Map/IndiaMap";
import { Link } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
 return (
  <div className="dashboard">

    {/* Carousel Section */}
    <section className="carousel-section">
      <div className="carousel-placeholder">
        Carousel Image Here
      </div>
    </section>

    {/* India Map Section */}
    <div className="dashboard-middle">

  {/* Left Side - India Map */}
 <div className="india-map">
    <IndiaMap />
</div>

  {/* Right Side - Pyramid */}
  <div className="dashboard-pyramid">

    <svg viewBox="0 0 800 450" width="100%" height="100%">

  {/* Triangles */}
  <polygon points="400,30 200,230 600,230" fill="#90caf9" />
  <polygon points="200,230 10,420 400,420" fill="#a5d6a7" />
  <polygon points="200,230 600,230 400,420" fill="#f48fb1" />
  <polygon points="600,230 400,420 790,420" fill="#b39ddb" />

  {/* Dashboard */}
  <Link to="/dashboard">

    <ellipse
      cx="400"
      cy="145"
      rx="80"
      ry="28"
      fill="white"
      stroke="#dddddd"
    />

    <text
      x="400"
      y="151"
      textAnchor="middle"
      fontSize="15"
      fontWeight="600"
    >
      Dashboard
    </text>

  </Link>

  {/* Advance Booking */}

  <Link to="/advance-booking">

    <ellipse
      cx="210"
      cy="320"
      rx="75"
      ry="28"
      fill="white"
      stroke="#dddddd"
    />

    <text
      x="210"
      y="326"
      textAnchor="middle"
      fontSize="15"
      fontWeight="600"
    >
      Advance
    </text>

  </Link>

  {/* Login */}

  <Link to="/login/national">

    <ellipse
      cx="400"
      cy="295"
      rx="70"
      ry="28"
      fill="white"
      stroke="#dddddd"
    />

    <text
      x="400"
      y="301"
      textAnchor="middle"
      fontSize="15"
      fontWeight="600"
    >
      Login
    </text>

  </Link>

  {/* FAQs */}

  <Link to="/faqs">

    <ellipse
      cx="590"
      cy="320"
      rx="75"
      ry="28"
      fill="white"
      stroke="#dddddd"
    />

    <text
      x="590"
      y="326"
      textAnchor="middle"
      fontSize="15"
      fontWeight="600"
    >
      FAQs
    </text>

  </Link>

</svg>

  </div>

</div>

    {/* Dashboard Statistics */}
    {/* Statistics Cards */}
<section className="stats-section">

  <div className="section-title">
    <span>DASHBOARD</span>
    <h2>Dashboard Statistics</h2>
    <p>
    Statistics and analytics of the Harit SANKALP Portal.
    </p>
  </div>

  <div className="stats-grid">

    <div className="dashboard-card card-gray">
      <div className="card-body">
        <p className="card-title">Total number of States Onboarded</p>
        <h3 className="card-value">15</h3>
      </div>
      <a href="#" className="card-footer">
        View Details <span>&#10095;</span>
      </a>
    </div>

    <div className="dashboard-card card-green">
      <div className="card-body">
        <p className="card-title">Total number of Nurseries across the Nation</p>
        <h3 className="card-value">867</h3>
      </div>
      <a href="#" className="card-footer">
        View Details <span>&#10095;</span>
      </a>
    </div>

    <div className="dashboard-card card-pink">
      <div className="card-body">
        <p className="card-title">Total number Species available for distribution</p>
        <h3 className="card-value">0</h3>
      </div>
      <a href="#" className="card-footer">
        View Details <span>&#10095;</span>
      </a>
    </div>

    <div className="dashboard-card card-blue">
      <div className="card-body">
        <p className="card-title">Total seedlings available for distribution</p>
        <h3 className="card-value">0</h3>
      </div>
      <a href="#" className="card-footer">
        View Details <span>&#10095;</span>
      </a>
    </div>

    <div className="dashboard-card card-teal">
      <div className="card-body">
        <p className="card-title">Seed Production Area/ Candidate Plus Tree</p>
        <h3 className="card-value">0</h3>
      </div>
      <a href="#" className="card-footer">
        View Details <span>&#10095;</span>
      </a>
    </div>

    <div className="dashboard-card card-red">
      <div className="card-body">
        <p className="card-title">Seed Orchard</p>
        <h3 className="card-value">0</h3>
      </div>
      <a href="#" className="card-footer">
        View Details <span>&#10095;</span>
      </a>
    </div>

    <div className="dashboard-card card-lightgreen">
      <div className="card-body">
        <p className="card-title">Research Institute</p>
        <h3 className="card-value">0</h3>
      </div>
      <a href="#" className="card-footer">
        View Details <span>&#10095;</span>
      </a>
    </div>

    <div className="dashboard-card card-orange">
      <div className="card-body">
        <p className="card-title">Seed Processing cum Treatment Unit</p>
        <h3 className="card-value">0</h3>
      </div>
      <a href="#" className="card-footer">
        View Details <span>&#10095;</span>
      </a>
    </div>

  </div>

</section>

   {/* Nursery Information */}
<section className="nursery-section">

  <div className="section-title">
    <span>NURSERY INFORMATION</span>
    <h2>Forest Nursery Information</h2>
    <p>
      Explore nursery services, registrations and reports across India.
    </p>
  </div>

  <div className="chart-filters">

    <button className="filter-btn">State</button>

    <button className="filter-btn">District</button>

    <button className="filter-btn">Division</button>

    <button className="filter-btn">Species</button>

    <button className="filter-btn">Height</button>

    <button className="filter-btn filter-btn-green">
      Filter
    </button>

    <button className="filter-btn filter-btn-red">
      Reset
    </button>

  </div>

</section>

    {/* Reports & Charts */}
<section className="chart-section">

  <div className="section-title">
    <span>ANALYTICS</span>
    <h2>Reports & Charts</h2>
    <p>
      Visual insights showing nursery distribution and statistics across the country.
    </p>
  </div>
  <DashboardCharts />
</section>
  </div>
);
}

export default Dashboard;