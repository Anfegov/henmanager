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
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
  Chip
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { customersApi } from "../api/customersApi";
import { useAuth } from "../auth/useAuth";

const emptyForm = {
  id: null,
  name: "",
  phone: "",
  email: "",
  address: "",
  isActive: true
};

export const CustomersPage = () => {
  const { hasPermission } = useAuth();
  const canManage = hasPermission("ManageCustomers");
  const canView = hasPermission("ManageCustomers") || hasPermission("ViewCustomers");

  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  const showSnack = (msg, severity="success") =>
    setSnack({ open: true, msg, severity });

  const load = async () => {
    setLoading(true);
    try {
      const data = await customersApi.getAll();
      setCustomers(data ?? []);
    } catch (e) {
      showSnack("No fue posible cargar clientes.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (canView) load(); }, [canView]);

  const handleOpen = (customer=null) => {
    if (!canManage) return;
    if (customer) setForm({
      id: customer.id,
      name: customer.name ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
      address: customer.address ?? "",
      isActive: customer.isActive ?? true
    });
    else setForm(emptyForm);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!canManage) return;
    if (!form.name.trim()) {
      showSnack("El nombre es obligatorio.", "warning");
      return;
    }
    try {
      if (form.id) {
        await customersApi.update(form.id, {
          name: form.name.trim(),
          phone: form.phone?.trim(),
          email: form.email?.trim(),
          address: form.address?.trim(),
          isActive: form.isActive
        });
        showSnack("Cliente actualizado.");
      } else {
        await customersApi.create({
          name: form.name.trim(),
          phone: form.phone?.trim(),
          email: form.email?.trim(),
          address: form.address?.trim(),
          isActive: form.isActive
        });
        showSnack("Cliente creado.");
      }
      setOpen(false);
      setForm(emptyForm);
      await load();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data?.title || "Error guardando cliente.";
      showSnack(msg, "error");
    }
  };

  const handleDelete = async (id) => {
    if (!canManage) return;
    if (!confirm("¿Eliminar cliente? Solo se permite si no tiene ventas asociadas.")) return;
    try {
      await customersApi.remove(id);
      showSnack("Cliente eliminado.");
      await load();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data?.title || "No fue posible eliminar.";
      showSnack(msg, "error");
    }
  };

  const totals = useMemo(() => ({
    total: customers.length,
    active: customers.filter(c => c.isActive).length
  }), [customers]);

  if (!canView) {
    return (
      <Alert severity="error">
        No tienes permisos para ver clientes.
      </Alert>
    );
  }

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <Typography variant="h6">Clientes</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip label={`Total: ${totals.total}`} />
                <Chip color="success" label={`Activos: ${totals.active}`} />
                <Chip label={`Inactivos: ${totals.total - totals.active}`} />
              </Stack>
            </div>
            {canManage && (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpen()}>
                Nuevo
              </Button>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Teléfono</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Dirección</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>{c.name}</TableCell>
                    <TableCell>{c.phone || "-"}</TableCell>
                    <TableCell>{c.email || "-"}</TableCell>
                    <TableCell>{c.address || "-"}</TableCell>
                    <TableCell>
                      {c.isActive ? (
                        <Chip size="small" color="success" label="Activo" />
                      ) : (
                        <Chip size="small" label="Inactivo" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton disabled={!canManage} onClick={() => handleOpen(c)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton disabled={!canManage} color="error" onClick={() => handleDelete(c.id)}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {customers.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      No hay clientes registrados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{form.id ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
              required
              disabled={!canManage}
            />
            <TextField
              label="Teléfono"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              fullWidth
              disabled={!canManage}
            />
            <TextField
              label="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              fullWidth
              disabled={!canManage}
            />
            <TextField
              label="Dirección"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              fullWidth
              disabled={!canManage}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  disabled={!canManage}
                />
              }
              label="Activo"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          {canManage && (
            <Button variant="contained" onClick={handleSave}>Guardar</Button>
          )}
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack(s => ({ ...s, open: false }))}
      >
        <Alert severity={snack.severity} sx={{ width: "100%" }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Grid>
  );
};

export default CustomersPage;
