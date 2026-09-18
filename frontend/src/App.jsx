import { Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout.jsx";
import ProtectedRoute from "./components/common/ProtectedRoute.jsx";
import AdminRoute from "./components/common/AdminRoute.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";
import NotFound from "./pages/NotFound.jsx";

import Documents from "./pages/documents/Documents.jsx";
import DocumentDetails from "./pages/documents/DocumentDetails.jsx";
import UploadDocument from "./pages/documents/UploadDocument.jsx";

import Materials from "./pages/materials/Materials.jsx";
import MaterialDetails from "./pages/materials/MaterialDetails.jsx";
import CreateMaterial from "./pages/materials/CreateMaterial.jsx";

import Dashboard from "./pages/admin/Dashboard.jsx";
import AdminDocuments from "./pages/admin/AdminDocuments.jsx";
import AdminMaterials from "./pages/admin/AdminMaterials.jsx";
import AdminReports from "./pages/admin/AdminReports.jsx";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public */}
        <Route path="/" element={<Home />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/documents/:id" element={<DocumentDetails />} />
        <Route path="/materials" element={<Materials />} />
        <Route path="/materials/:id" element={<MaterialDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Authentifié */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/documents/upload" element={<UploadDocument />} />
          <Route path="/materials/create" element={<CreateMaterial />} />
        </Route>

        {/* Admin */}
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/documents" element={<AdminDocuments />} />
          <Route path="/admin/materials" element={<AdminMaterials />} />
          <Route path="/admin/reports" element={<AdminReports />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
