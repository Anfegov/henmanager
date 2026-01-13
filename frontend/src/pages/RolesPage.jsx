import React, { useEffect, useMemo, useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Box,
  Chip,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Collapse,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AddIcon from "@mui/icons-material/Add";
import CreateIcon from "@mui/icons-material/Create";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import LockIcon from "@mui/icons-material/Lock";
import {
  createRole,
  deleteRole,
  getPermissions,
  getRoles,
  updateRole,
} from "../api/rolesApi";
import { useAuth } from "../auth/useAuth";

// Mapeo de módulos a nombres en español
const moduleNames = {
  Batches: "Camadas",
  Batch: "Camadas",
  Production: "Producción",
  DailyProduction: "Producción",
  Sales: "Ventas",
  Sale: "Ventas",
  Supplies: "Insumos",
  Supply: "Insumos",
  Customers: "Clientes",
  Customer: "Clientes",
  Credits: "Créditos",
  Credit: "Créditos",
  Payment: "Créditos",
  Reports: "Reportes",
  EggTypes: "Tipos de Huevo",
  EggType: "Tipos de Huevo",
  Users: "Usuarios",
  User: "Usuarios",
  Roles: "Roles",
  Role: "Roles",
  Dashboard: "Dashboard",
};

// Mapeo de acciones a iconos y nombres
const actionInfo = {
  View: { icon: <VisibilityIcon fontSize="small" />, label: "Ver", color: "info" },
  Create: { icon: <AddIcon fontSize="small" />, label: "Crear", color: "success" },
  Edit: { icon: <CreateIcon fontSize="small" />, label: "Editar", color: "warning" },
  Delete: { icon: <DeleteOutlineIcon fontSize="small" />, label: "Eliminar", color: "error" },
  Register: { icon: <AddIcon fontSize="small" />, label: "Registrar", color: "success" },
  Close: { icon: <LockIcon fontSize="small" />, label: "Cerrar", color: "warning" },
  Cancel: { icon: <DeleteOutlineIcon fontSize="small" />, label: "Cancelar", color: "error" },
  Manage: { icon: <CreateIcon fontSize="small" />, label: "Gestionar", color: "primary" },
};

// Orden de módulos para mostrar
const moduleOrder = [
  "Dashboard",
  "Camadas",
  "Producción",
  "Ventas",
  "Insumos",
  "Clientes",
  "Créditos",
  "Reportes",
  "Tipos de Huevo",
  "Usuarios",
  "Roles",
];

export const RolesPage = () => {
  const { hasPermission } = useAuth();
  const [roles, setRoles] = useState([]);
  const [perms, setPerms] = useState([]);
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [confirm, setConfirm] = useState({ open: false, id: null });
  const [expandedRole, setExpandedRole] = useState(null);

  const canCreate = hasPermission("CreateRole");
  const canEdit = hasPermission("EditRole");
  const canDelete = hasPermission("DeleteRole");

  // Agrupa permisos por módulo
  const groupedPerms = useMemo(() => {
    const groups = {};

    perms.forEach((p) => {
      const code = p.code || "";

      // Extraer acción y módulo del código
      let action = "";
      let module = "";

      for (const act of Object.keys(actionInfo)) {
        if (code.startsWith(act)) {
          action = act;
          module = code.substring(act.length);
          break;
        }
      }

      if (!action) {
        action = "Manage";
        module = code;
      }

      // Obtener nombre del módulo en español
      const moduleName = moduleNames[module] || module;

      if (!groups[moduleName]) {
        groups[moduleName] = [];
      }

      groups[moduleName].push({
        ...p,
        action,
        actionInfo: actionInfo[action] || actionInfo.Manage,
      });
    });

    // Ordenar permisos dentro de cada grupo
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => {
        const order = ["View", "Create", "Register", "Edit", "Delete", "Close", "Cancel"];
        return order.indexOf(a.action) - order.indexOf(b.action);
      });
    });

    return groups;
  }, [perms]);

  // Ordenar módulos
  const sortedModules = useMemo(() => {
    return Object.keys(groupedPerms).sort((a, b) => {
      const indexA = moduleOrder.indexOf(a);
      const indexB = moduleOrder.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b);
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    });
  }, [groupedPerms]);

  // Crear mapa de permisos por ID para lookup rápido
  const permById = useMemo(() => {
    const map = {};
    perms.forEach((p) => {
      map[p.id] = p;
    });
    return map;
  }, [perms]);

  const load = async () => {
    const [rRes, pRes] = await Promise.all([getRoles(), getPermissions()]);
    setRoles(rRes.data);
    setPerms(pRes.data);
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setName("");
    setSelectedIds([]);
  };

  const togglePerm = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleModule = (modulePerms) => {
    const ids = modulePerms.map((p) => p.id);
    const allSelected = ids.every((id) => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      setSelectedIds((prev) => [...new Set([...prev, ...ids])]);
    }
  };

  const onEdit = (role) => {
    setEditing(role);
    setName(role.name);
    setSelectedIds(role.permissionIds || []);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const payload = { name, permissionIds: selectedIds };

    if (editing) {
      await updateRole(editing.id, payload);
    } else {
      await createRole(payload);
    }
    await load();
    resetForm();
  };

  const doDelete = async () => {
    await deleteRole(confirm.id);
    setConfirm({ open: false, id: null });
    await load();
  };

  // Resumen de permisos de un rol por módulo
  const getRoleSummary = (role) => {
    const permIds = role.permissionIds || [];
    const summary = {};

    permIds.forEach((id) => {
      const perm = permById[id];
      if (!perm) return;

      const code = perm.code || "";
      let module = "";

      for (const act of Object.keys(actionInfo)) {
        if (code.startsWith(act)) {
          module = code.substring(act.length);
          break;
        }
      }

      const moduleName = moduleNames[module] || module;
      if (!summary[moduleName]) {
        summary[moduleName] = 0;
      }
      summary[moduleName]++;
    });

    return summary;
  };

  return (
    <Grid container spacing={2}>
      {(canCreate || canEdit) && (
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {editing ? "Editar rol" : "Crear rol"}
              </Typography>

              <form onSubmit={onSubmit}>
                <TextField
                  label="Nombre del rol"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                  margin="normal"
                  required
                  size="small"
                />

                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: "text.secondary" }}>
                  Permisos por módulo
                </Typography>

                <Box sx={{ maxHeight: 450, overflow: "auto" }}>
                  {sortedModules.map((moduleName) => {
                    const modulePerms = groupedPerms[moduleName];
                    const selectedCount = modulePerms.filter((p) =>
                      selectedIds.includes(p.id)
                    ).length;
                    const allSelected = selectedCount === modulePerms.length;
                    const someSelected = selectedCount > 0 && !allSelected;

                    return (
                      <Accordion
                        key={moduleName}
                        disableGutters
                        elevation={0}
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          "&:not(:last-child)": { borderBottom: 0 },
                          "&:before": { display: "none" },
                        }}
                      >
                        <AccordionSummary
                          expandIcon={<ExpandMoreIcon />}
                          sx={{
                            bgcolor: allSelected
                              ? "primary.lighter"
                              : someSelected
                              ? "action.hover"
                              : "background.paper",
                            minHeight: 48,
                            "& .MuiAccordionSummary-content": { my: 0 },
                          }}
                        >
                          <FormControlLabel
                            onClick={(e) => e.stopPropagation()}
                            control={
                              <Checkbox
                                checked={allSelected}
                                indeterminate={someSelected}
                                onChange={() => toggleModule(modulePerms)}
                                size="small"
                              />
                            }
                            label={
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography variant="body2" fontWeight={500}>
                                  {moduleName}
                                </Typography>
                                <Chip
                                  label={`${selectedCount}/${modulePerms.length}`}
                                  size="small"
                                  color={allSelected ? "primary" : "default"}
                                  sx={{ height: 20, fontSize: "0.7rem" }}
                                />
                              </Box>
                            }
                          />
                        </AccordionSummary>
                        <AccordionDetails sx={{ pt: 1, pb: 2 }}>
                          <Stack spacing={0.5}>
                            {modulePerms.map((p) => {
                              const selected = selectedIds.includes(p.id);
                              return (
                                <FormControlLabel
                                  key={p.id}
                                  control={
                                    <Checkbox
                                      checked={selected}
                                      onChange={() => togglePerm(p.id)}
                                      size="small"
                                    />
                                  }
                                  label={
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                      <Chip
                                        icon={p.actionInfo.icon}
                                        label={p.actionInfo.label}
                                        size="small"
                                        color={selected ? p.actionInfo.color : "default"}
                                        variant={selected ? "filled" : "outlined"}
                                        sx={{
                                          height: 24,
                                          "& .MuiChip-icon": { fontSize: 16 }
                                        }}
                                      />
                                      <Typography variant="body2" color="text.secondary">
                                        {p.name}
                                      </Typography>
                                    </Box>
                                  }
                                  sx={{ ml: 0 }}
                                />
                              );
                            })}
                          </Stack>
                        </AccordionDetails>
                      </Accordion>
                    );
                  })}
                </Box>

                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Button type="submit" variant="contained">
                    {editing ? "Guardar cambios" : "Crear rol"}
                  </Button>
                  {editing && (
                    <Button onClick={resetForm} variant="outlined">
                      Cancelar
                    </Button>
                  )}
                </Stack>
              </form>
            </CardContent>
          </Card>
        </Grid>
      )}

      <Grid item xs={12} md={canCreate || canEdit ? 7 : 12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Roles del sistema
            </Typography>

            <Stack spacing={1}>
              {roles.map((r) => {
                const summary = getRoleSummary(r);
                const isExpanded = expandedRole === r.id;

                return (
                  <Card key={r.id} variant="outlined">
                    <Box
                      sx={{
                        p: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        "&:hover": { bgcolor: "action.hover" },
                      }}
                      onClick={() => setExpandedRole(isExpanded ? null : r.id)}
                    >
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {r.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {(r.permissionIds || []).length} permisos en{" "}
                          {Object.keys(summary).length} módulos
                        </Typography>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        {canEdit && (
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit(r);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        )}
                        {canDelete && (
                          <IconButton
                            size="small"
                            color="error"
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirm({ open: true, id: r.id });
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                        <ExpandMoreIcon
                          sx={{
                            transform: isExpanded ? "rotate(180deg)" : "none",
                            transition: "transform 0.2s",
                          }}
                        />
                      </Box>
                    </Box>
                    <Collapse in={isExpanded}>
                      <Box sx={{ px: 2, pb: 2 }}>
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                          {Object.entries(summary)
                            .sort((a, b) => moduleOrder.indexOf(a[0]) - moduleOrder.indexOf(b[0]))
                            .map(([mod, count]) => (
                              <Chip
                                key={mod}
                                label={`${mod}: ${count}`}
                                size="small"
                                variant="outlined"
                                color="primary"
                              />
                            ))}
                        </Box>
                      </Box>
                    </Collapse>
                  </Card>
                );
              })}
            </Stack>

            {roles.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                No hay roles creados.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Dialog open={confirm.open} onClose={() => setConfirm({ open: false, id: null })}>
        <DialogTitle>Eliminar rol</DialogTitle>
        <DialogContent>
          <Typography>¿Seguro que deseas eliminar este rol?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm({ open: false, id: null })}>Cancelar</Button>
          <Button onClick={doDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};
