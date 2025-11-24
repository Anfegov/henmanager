import React, { useEffect, useMemo, useState } from "react";
import {
  Grid, Card, CardContent, Typography, TextField, Button, Stack, Chip,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Checkbox, FormControlLabel
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { createRole, deleteRole, getPermissions, getRoles, updateRole } from "../api/rolesApi";

export const RolesPage = () => {
  const [roles, setRoles] = useState([]);
  const [perms, setPerms] = useState([]);

  const [editing, setEditing] = useState(null);
  const [name, setName] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);

  const [confirm, setConfirm] = useState({ open: false, id: null });

  const groupedPerms = useMemo(() => {
    // agrupa por primera palabra del code (CamelCase)
    const groups = {};
    for (const p of perms) {
      const group = (p.code.match(/^[A-Z][a-z]+/) || [p.code])[0];
      groups[group] = groups[group] || [];
      groups[group].push(p);
    }
    return groups;
  }, [perms]);

  const load = async () => {
    const [rRes, pRes] = await Promise.all([getRoles(), getPermissions()]);
    setRoles(rRes.data);
    setPerms(pRes.data);
  };

  useEffect(() => { load(); }, []);

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

              <Stack spacing={1} sx={{ maxHeight: 360, overflow: "auto", pr: 1 }}>
                {Object.entries(groupedPerms).map(([group, list]) => {
                  const allChecked = list.every(p => selectedIds.includes(p.id));
                  const someChecked = list.some(p => selectedIds.includes(p.id));

                  return (
                    <Card key={group} variant="outlined" sx={{ p: 1 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={allChecked}
                            indeterminate={!allChecked && someChecked}
                            onChange={() => {
                              const ids = list.map(p => p.id);
                              setSelectedIds(prev => {
                                const hasAll = ids.every(i => prev.includes(i));
                                return hasAll
                                  ? prev.filter(i => !ids.includes(i))
                                  : Array.from(new Set([...prev, ...ids]));
                              });
                            }}
                          />
                        }
                        label={<Typography variant="subtitle2">{group}</Typography>}
                      />

                      <Stack direction="row" flexWrap="wrap" gap={1} sx={{ pl: 3 }}>
                        {list.map(p => (
                          <Chip
                            key={p.id}
                            label={`${p.code} - ${p.name}`}
                            color={selectedIds.includes(p.id) ? "primary" : "default"}
                            onClick={() => togglePerm(p.id)}
                            sx={{ cursor: "pointer" }}
                          />
                        ))}
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
                  <Button onClick={resetForm}>
                    Cancelar
                  </Button>
                )}
              </Stack>
            </form>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={7}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Roles</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Permisos</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {roles.map(r => (
                  <TableRow key={r.id}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>
                      {(r.permissionIds || []).length} permisos
                    </TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => onEdit(r)}><EditIcon /></IconButton>
                      <IconButton color="error" onClick={() => setConfirm({open:true,id:r.id})}><DeleteIcon /></IconButton>
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

      <Dialog open={confirm.open} onClose={()=>setConfirm({open:false,id:null})}>
        <DialogTitle>Eliminar rol</DialogTitle>
        <DialogContent>
          <Typography>¿Seguro que deseas eliminar este rol?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setConfirm({open:false,id:null})}>Cancelar</Button>
          <Button onClick={doDelete} color="error" variant="contained">Eliminar</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};