import * as React from "react";
import {
  AppBar, Box, CssBaseline, Divider, Drawer, IconButton, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Toolbar, Typography, Button
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import EggIcon from "@mui/icons-material/Egg";
import LayersIcon from "@mui/icons-material/Layers";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import PaidIcon from "@mui/icons-material/Paid";
import InventoryIcon from "@mui/icons-material/Inventory";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DashboardIcon from "@mui/icons-material/Dashboard";
import GroupIcon from "@mui/icons-material/Group";
import SecurityIcon from "@mui/icons-material/Security";
import CategoryIcon from "@mui/icons-material/Category";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/useAuth";

const drawerWidth = 240;

export function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const { user, logout, hasRole, hasPermission } = useAuth();

  const handleDrawerToggle = () => setMobileOpen((p) => !p);

  const menuItems = React.useMemo(() => {
    const common = [
      { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
      { text: "Camadas", icon: <LayersIcon />, path: "/batches" },
      { text: "Postura diaria", icon: <EggIcon />, path: "/production" },
      { text: "Ventas", icon: <ShoppingCartIcon />, path: "/sales" },
      { text: "Insumos", icon: <InventoryIcon />, path: "/supplies" },
      { text: "Reportes", icon: <AssessmentIcon />, path: "/reports" },
      { text: "Cartera / Créditos", icon: <PaidIcon />, path: "/credits" }
    ];

    // Clientes: visible a quien tenga permiso ManageCustomers (Admin lo tiene)
    if (hasPermission?.("ManageCustomers")) {
      common.splice(4, 0, { text: "Clientes", icon: <GroupIcon />, path: "/customers" });
      // inserta antes de Ventas/insumos para mantener orden natural
    }

    // Opciones solo Admin (como tu premisa)
    if (hasRole?.("Admin")) {
      common.push(
        { text: "Usuarios", icon: <GroupIcon />, path: "/users" },
        { text: "Roles / Permisos", icon: <SecurityIcon />, path: "/roles" }
      );
      // Catálogo de tipos de huevo solo Admin
      if (hasPermission?.("ManageEggTypes")) {
        common.push({ text: "Tipos de huevo", icon: <CategoryIcon />, path: "/egg-types" });
      }
    }

    return common;
  }, [hasRole, hasPermission]);

  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => { navigate(item.path); setMobileOpen(false); }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text}/>
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Control de postura por camada
          </Typography>
          {user && (
  <>
    <Typography variant="body2" sx={{ mr: 2 }}>
      {user.userName} (
        {(() => {
          const roles = user.roles || [];
          const rolesText = roles
            .map(r => {
              if (typeof r === "string") return r;
              // intenta tomar la propiedad más típica
              return r.name || r.roleName || "";
            })
            .filter(Boolean)
            .join(", ");

          return rolesText || "sin rol";
        })()}
      )
    </Typography>
    <Button color="inherit" onClick={logout}>Salir</Button>
  </>
)}
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", sm: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth }
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", sm: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth }
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: "100vh",
          backgroundColor: (t) =>
            t.palette.mode === "light" ? "#f5f5f5" : t.palette.background.default
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
}
