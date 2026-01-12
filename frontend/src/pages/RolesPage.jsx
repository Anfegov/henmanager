import React, { useEffect, useMemo, useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Chip,
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
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
  createRole,
  deleteRole,
  getPermissions,
  getRoles,
  updateRole,
} from "../api/rolesApi";

// Formatea el nombre del grupo para que se vea bonito en la UI
const formatGroupName = (key) =>
  key
    .replace(/([a-z])([A-Z])/g, "$1 $2") // DailyProduction -> Daily Production
    .replace(/([A-Za-z])([0-9])/g, "$1 $2") // Texto1 -> Texto 1
    .replace(/^./, (c) => c.toUpperCase()); // primera letra en mayúscula

export const RolesPage = () => {
  const [roles, setRoles] = useState([]);
  const [perms, setPerms] = useState([]);

  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const [confirm, setConfirm] = useState({ open: false, id: null });

  // Agrupa permisos por módulo de forma dinámica (Batch, Sales, Users, etc.)
  const groupedPerms = useMemo(() => {
    // 1. procesamos cada permiso
    const cleaned = perms.map((p) => {
      const words = p.code?.match(/[A-Z][a-z0-9]*/g) || [p.code];

      if (words.length <= 1) {
        return {
          ...p,
          group: "Otros",
          singular: "Otros",
          plural: "Otros",
        };
      }

      // quitamos el verbo inicial (Create, View, Register, Manage, etc.)
      let group = words.slice(1).join(""); // RegisterDailyProduction -> DailyProduction

      const singular = group.endsWith("s") ? group.slice(0, -1) : group;
      const plural = singular + "s";

      return { ...p, group, singular, plural };
    });

    // 2. construimos grupos reales (unificando plural/singular)
    const groups = {};

    for (const p of cleaned) {
      let groupName = p.group;

      if (groups[p.singular]) groupName = p.singular;
      else if (groups[p.plural]) groupName = p.plural;

      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(p);
    }

    // 3. orden interno por code
    for (const key in groups) {
      groups[key].sort((a, b) => a.code.localeCompare(b.code));
    }

    return groups;
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

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={5}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {editing ? "Editar rol" : "Crear rol"}
            </Typography>

            <form onSubmit={onSubmit}>
              <TextField
                label="Nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                margin="normal"
                required
              />

              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Permisos (catálogo)
              </Typography>

              <Stack
                spacing={1}
                sx={{ maxHeight: 360, overflow: "auto", pr: 1 }}
              >
                {Object.entries(groupedPerms).map(([group, list]) => {
                  const allChecked = list.every((p) =>
                    selectedIds.includes(p.id)
                  );
                  const someChecked = list.some((p) =>
                    selectedIds.includes(p.id)
                  );

                  return (
                    <Card
  key={group}
  variant="outlined"
  sx={{
    p: 1.5,
    borderRadius: 2,
    bgcolor: "#faf7f5",
    overflow: "visible",
  }}
>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={allChecked}
                            indeterminate={!allChecked && someChecked}
                            onChange={() => {
                              const ids = list.map((p) => p.id);
                              setSelectedIds((prev) => {
                                const hasAll = ids.every((i) =>
                                  prev.includes(i)
                                );
                                return hasAll
                                  ? prev.filter((i) => !ids.includes(i))
                                  : Array.from(
                                      new Set([...prev, ...ids])
                                    );
                              });
                            }}
                          />
                        }
                        label={
                          <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 600 }}
                          >
                            {formatGroupName(group)}
                          </Typography>
                        }
                      />

                      <Stack
                        sx={{
                          pl: 3,
                          pt: 0.5,
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 1,
                        }}
                      >
                        {list.map((p) => {
                          const selected = selectedIds.includes(p.id);
                          return (
                            <Chip
                              key={p.id}
                              size="small"
                              variant={selected ? "filled" : "outlined"}
                              color={selected ? "primary" : "default"}
                              label={`${p.code} - ${p.name}`}
                              onClick={() => togglePerm(p.id)}
                              clickable
                              sx={{
                                maxWidth: "100%",
                                borderRadius: 999,
                                "& .MuiChip-label": {
                                  whiteSpace: "normal",
                                  overflow: "visible",
                                  textOverflow: "unset",
                                  lineHeight: 1.2,
                                  display: "block",
                                },
                              }}
                            />
                          );
                        })}
                      </Stack>
                    </Card>
                  );
                })}
              </Stack>

              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button type="submit" variant="contained">
                  {editing ? "Guardar" : "Crear"}
                </Button>
                {editing && (
                  <Button onClick={resetForm}>Cancelar</Button>
                )}
              </Stack>
            </form>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={7}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Roles
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Permisos</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>
                      {(r.permissionIds || []).length} permisos
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => onEdit(r)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() =>
                          setConfirm({ open: true, id: r.id })
                        }
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {roles.length === 0 && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                No hay roles creados.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Dialog
        open={confirm.open}
        onClose={() => setConfirm({ open: false, id: null })}
      >
        <DialogTitle>Eliminar rol</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Seguro que deseas eliminar este rol?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirm({ open: false, id: null })}
          >
            Cancelar
          </Button>
          <Button
            onClick={doDelete}
            color="error"
            variant="contained"
          >
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};
