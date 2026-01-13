import React from "react";
import { ThemeProvider, CssBaseline } from "@mui/material";
import { theme } from "./theme";
import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import ProtectedRoute from "./auth/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { BatchesPage } from "./pages/BatchesPage";
import { ProductionPage } from "./pages/ProductionPage";
import SalesPage from "./pages/SalesPage";
import { SuppliesPage } from "./pages/SuppliesPage";
import { ReportsPage } from "./pages/ReportsPage";
import CustomersPage from "./pages/CustomersPage";
import CreditsPage from "./pages/CreditsPage";
import { UsersPage } from "./pages/UsersPage";
import { RolesPage } from "./pages/RolesPage";
import EggTypesPage from "./pages/EggTypesPage";

export default function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <ProtectedRoute requiredPermission="ViewDashboard">
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/batches"
          element={
            <ProtectedRoute requiredPermission="ViewBatches">
              <Layout><BatchesPage /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/production"
          element={
            <ProtectedRoute requiredPermission="ViewProduction">
              <Layout><ProductionPage /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/sales"
          element={
            <ProtectedRoute requiredPermission="ViewSales">
              <Layout><SalesPage /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/supplies"
          element={
            <ProtectedRoute requiredPermission="ViewSupplies">
              <Layout><SuppliesPage /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute requiredPermission="ViewReports">
              <Layout><ReportsPage /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/customers"
          element={
            <ProtectedRoute requiredPermission="ViewCustomers">
              <Layout><CustomersPage /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/credits"
          element={
            <ProtectedRoute requiredPermission="ViewCredits">
              <Layout><CreditsPage /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute requiredPermission="ViewUsers">
              <Layout><UsersPage /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/roles"
          element={
            <ProtectedRoute requiredPermission="ViewRoles">
              <Layout><RolesPage /></Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/egg-types"
          element={
            <ProtectedRoute requiredPermission="ViewEggTypes">
              <Layout><EggTypesPage /></Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </ThemeProvider>
  );
}
