import React, { useEffect, useMemo, useState } from "react";
import {
  Grid, Card, CardContent, Typography, TextField, Button, Stack,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, MenuItem, Checkbox, ListItemText
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { getRoles } from "../api/rolesApi";
import { createUser, deleteUser, getUsers, updateUser } from "../api/usersApi";

export const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);

  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState({ open:false, id:null });

  const [form, setForm] = useState({
    userName: "",
    password: "",
    isActive: true,
    roleIds: []
  });

  const load = async () => {
    const [uRes, rRes] = await Promise.all([getUsers(), getRoles()]);
    setUsers(uRes.data);
    setRoles(rRes.data);
  };

  useEffect(() => { load(); }, []);

  const roleMap = useMemo(
    () => new Map(roles.map(r => [r.id, r.name])),
    [roles]
  );

  const onEdit = (u) => {
    setEditing(u);
    setForm({
      userName: u.userName,
      password: "",
      isActive: u.isActive,
      roleIds: u.roleIds || []
    });
  };

  const resetForm = () => {
    setEditing(null);
    setForm({ userName:"", password:"", isActive:true, roleIds:[] });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.userName.trim()) return;

    if (editing) {
      await updateUser(editing.id, {
        userName: form.userName,
        isActive: form.isActive,
        roleIds: form.roleIds
      });
    } else {
      await createUser({
        userName: form.userName,
        password: form.password || "User123*",
        roleIds: form.roleIds
      });
    }

    await load();
    resetForm();
  };

  const doDelete = async () => {
    await deleteUser(confirm.id);
    setConfirm({ open:false, id:null });
    await load();
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={5}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {editing ? "Editar usuario" : "Crear usuario"}
            </Typography>

            <form onSubmit={onSubmit}>
              <TextField
                label="Usuario"
                value={form.userName}
                onChange={(e)=>setForm(f=>({...f,userName:e.target.value}))}
                fullWidth
                margin="normal"
                required
              />

              {!editing && (
                <TextField
                  label="Contraseña"
                  type="password"
                  value={form.password}
                  onChange={(e)=>setForm(f=>({...f,password:e.target.value}))}
                  fullWidth
                  margin="normal"
                  helperText="Si la dejas vacía se usa User123*"
                />
              )}

              <TextField
                select
                label="Roles"
                fullWidth
                margin="normal"
                SelectProps={{
                  multiple: true,
                  renderValue: (selected) =>
                    selected.map(id => roleMap.get(id)).filter(Boolean).join(", ")
                }}
                value={form.roleIds}
                onChange={(e)=>setForm(f=>({...f,roleIds:e.target.value}))}
              >
                {roles.map(r => (
                  <MenuItem key={r.id} value={r.id}>
                    <Checkbox checked={form.roleIds.includes(r.id)} />
                    <ListItemText primary={r.name} />
                  </MenuItem>
                ))}
              </TextField>

              {editing && (
                <TextField
                  select
                  label="Estado"
                  fullWidth
                  margin="normal"
                  value={form.isActive ? "true" : "false"}
                  onChange={(e)=>setForm(f=>({...f,isActive:e.target.value==="true"}))}
                >
                  <MenuItem value="true">Activo</MenuItem>
                  <MenuItem value="false">Inactivo</MenuItem>
                </TextField>
              )}

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
            <Typography variant="h6" gutterBottom>Usuarios</Typography>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Usuario</TableCell>
                  <TableCell>Roles</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map(u => (
                  <TableRow key={u.id}>
                    <TableCell>{u.userName}</TableCell>
                    <TableCell>
                      {(u.roleIds || []).map(id => roleMap.get(id)).filter(Boolean).join(", ")}
                    </TableCell>
                    <TableCell>{u.isActive ? "Activo" : "Inactivo"}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={()=>onEdit(u)}><EditIcon /></IconButton>
                      <IconButton color="error" onClick={()=>setConfirm({open:true,id:u.id})}><DeleteIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {users.length === 0 && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                No hay usuarios creados.
              </Typography>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Dialog open={confirm.open} onClose={()=>setConfirm({open:false,id:null})}>
        <DialogTitle>Eliminar usuario</DialogTitle>
        <DialogContent>
          <Typography>¿Seguro que deseas eliminar este usuario?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={()=>setConfirm({open:false,id:null})}>Cancelar</Button>
          <Button onClick={doDelete} color="error" variant="contained">
            Eliminar
          </Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};