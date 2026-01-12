import React, { useEffect, useState } from "react";
import {
  Grid, Card, CardContent, Typography, TextField, Button, Stack, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Snackbar, Alert, CircularProgress
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { getBatches } from "../api/batchesApi";
import { getSupplies, registerSupply, updateSupply, deleteSupply } from "../api/suppliesApi";

const today = new Date().toISOString().substring(0, 10);

export const SuppliesPage = () => {
  const [batches, setBatches] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  const [form, setForm] = useState({
    henBatchId: "",
    date: today,
    name: "",
    quantity: "",
    unit: "kg",
    cost: ""
  });

  const showSnack = (msg, severity = "success") =>
    setSnack({ open: true, msg, severity });

  const load = async () => {
    setLoading(true);
    try {
      const b = await getBatches();
      setBatches(b.data.filter(x => x.isActive));
      const s = await getSupplies({});
      setSupplies(s.data);
    } catch (err) {
      showSnack("Error cargando datos.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const resetForm = () => {
    setEditing(null);
    setForm({ henBatchId: "", date: today, name: "", quantity: "", unit: "kg", cost: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.henBatchId || !form.name || !form.quantity) return;

    setSaving(true);
    try {
      const payload = {
        henBatchId: form.henBatchId,
        date: form.date,
        name: form.name,
        quantity: Number(form.quantity),
        unit: form.unit,
        cost: Number(form.cost) || 0
      };

      if (editing) {
        await updateSupply(editing.id, payload);
        showSnack("Insumo actualizado.");
      } else {
        await registerSupply(payload);
        showSnack("Insumo registrado.");
      }
      resetForm();
      await load();
    } catch (err) {
      const msg = err?.response?.data || "Error guardando insumo.";
      showSnack(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (s) => {
    setEditing(s);
    setForm({
      henBatchId: s.henBatchId,
      date: s.date?.substring(0, 10) || today,
      name: s.name,
      quantity: s.quantity.toString(),
      unit: s.unit || "kg",
      cost: (s.cost || 0).toString()
    });
  };

  const handleDelete = async () => {
    try {
      await deleteSupply(confirmDelete.id);
      showSnack("Insumo eliminado.");
      setConfirmDelete({ open: false, id: null });
      await load();
    } catch (err) {
      const msg = err?.response?.data || "Error eliminando insumo.";
      showSnack(msg, "error");
    }
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              {editing ? "Editar insumo" : "Registrar insumo"}
            </Typography>
            <Stack spacing={2} component="form" onSubmit={handleSubmit}>
              <TextField select label="Camada" name="henBatchId"
                value={form.henBatchId} onChange={handleChange} fullWidth required>
                {batches.map(b => (
                  <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                ))}
              </TextField>

              <TextField label="Fecha" type="date" name="date"
                value={form.date} onChange={handleChange} fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: today }}
              />

              <TextField label="Insumo" name="name"
                value={form.name} onChange={handleChange} fullWidth required />

              <TextField label="Cantidad" type="number" name="quantity"
                value={form.quantity} onChange={handleChange} fullWidth required
                inputProps={{ min: 0.01, step: "0.01" }}
              />

              <TextField label="Unidad" name="unit"
                value={form.unit} onChange={handleChange} fullWidth />

              <TextField label="Costo" type="number" name="cost"
                value={form.cost} onChange={handleChange} fullWidth
                inputProps={{ min: 0, step: "0.01" }}
              />

              <Stack direction="row" spacing={1}>
                <Button type="submit" variant="contained" disabled={saving}>
                  {saving ? "Guardando..." : editing ? "Actualizar" : "Guardar"}
                </Button>
                {editing && (
                  <Button onClick={resetForm}>Cancelar</Button>
                )}
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Últimos insumos</Typography>
            {loading ? (
              <Stack alignItems="center" py={4}>
                <CircularProgress />
              </Stack>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell>Camada</TableCell>
                    <TableCell>Insumo</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Costo</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {supplies.map(s => {
                    const batch = batches.find(b => b.id === s.henBatchId);
                    return (
                      <TableRow key={s.id}>
                        <TableCell>{new Date(s.date).toLocaleDateString()}</TableCell>
                        <TableCell>{batch ? batch.name : "-"}</TableCell>
                        <TableCell>{s.name}</TableCell>
                        <TableCell align="right">{s.quantity} {s.unit}</TableCell>
                        <TableCell align="right">${Number(s.cost || 0).toFixed(2)}</TableCell>
                        <TableCell align="right">
                          <IconButton size="small" onClick={() => handleEdit(s)}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" color="error"
                            onClick={() => setConfirmDelete({ open: true, id: s.id })}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {supplies.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Typography variant="body2" color="text.secondary">
                          No hay insumos.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Dialog open={confirmDelete.open} onClose={() => setConfirmDelete({ open: false, id: null })}>
        <DialogTitle>Eliminar insumo</DialogTitle>
        <DialogContent>
          <Typography>¿Seguro que deseas eliminar este insumo?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete({ open: false, id: null })}>Cancelar</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Eliminar</Button>
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
