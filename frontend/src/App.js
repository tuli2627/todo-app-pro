import "./utils/i18n";
import Faqs from "./pages/faqs/Faqs";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/common/Layout";
import Home from "./pages/home/Home";
import Dashboard from "./pages/dashboard/Dashboard";
import DashboardDetails from "./pages/dashboard/DashboardDetails";
import Login from "./pages/login/Login";
import AdvanceBooking from "./pages/advancebooking/AdvanceBooking";
import Nursery from "./pages/Nursery/Nursery";
import UserGuides from "./pages/documentation/UserGuides";
import AboutUs from "./pages/about/AboutUs";
import { ToastProvider } from "./components/common/ToastProvider";
import SessionExpiryWatcher from "./components/common/SessionExpiryWatcher";
import WorkflowModulePage, {
  InternalApprovals,
  InternalDashboard,
  RequireWorkflowLogin,
  WorkflowRecordDetail,
} from "./pages/workflow/InternalWorkflow";
import {
  InternalNurseryMapping,
  InternalUserManagement,
} from "./pages/workflow/WorkflowDirectoryPages";
import InternalAdminPages from "./pages/workflow/InternalAdminPages";
import FieldProgressPage from "./pages/workflow/FieldProgressPage";


function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <SessionExpiryWatcher />
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/dashboard/details/:type" element={<DashboardDetails />} />
            <Route path="/dashboard/progress/:reportId" element={<DashboardDetails />} />
            <Route path="/internal/dashboard" element={<RequireWorkflowLogin><InternalDashboard /></RequireWorkflowLogin>} />
            <Route path="/internal/progress" element={<RequireWorkflowLogin><FieldProgressPage /></RequireWorkflowLogin>} />
            <Route path="/internal/approvals" element={<RequireWorkflowLogin><InternalApprovals /></RequireWorkflowLogin>} />
            <Route path="/internal/mapping" element={<RequireWorkflowLogin><InternalNurseryMapping /></RequireWorkflowLogin>} />
            <Route path="/internal/users" element={<RequireWorkflowLogin><InternalUserManagement /></RequireWorkflowLogin>} />
            <Route path="/internal/admin/:section" element={<RequireWorkflowLogin><InternalAdminPages /></RequireWorkflowLogin>} />
            <Route path="/internal/workflow/:module" element={<RequireWorkflowLogin><WorkflowModulePage /></RequireWorkflowLogin>} />
            <Route path="/internal/reports/:module" element={<RequireWorkflowLogin><WorkflowModulePage /></RequireWorkflowLogin>} />
            <Route path="/internal/records/:module/:recordId" element={<RequireWorkflowLogin><WorkflowRecordDetail /></RequireWorkflowLogin>} />
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
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;