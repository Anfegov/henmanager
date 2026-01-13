import React, { useEffect, useState } from "react";
import {
  Grid, Card, CardContent, Typography, TextField, Button, Stack, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Snackbar, Alert, CircularProgress
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { getBatches } from "../api/batchesApi";
import { getProductions, registerProduction, updateProduction, deleteProduction } from "../api/productionApi";
import { eggTypesApi } from "../api/eggTypesApi";
import { useAuth } from "../auth/useAuth";

const today = new Date().toISOString().substring(0, 10);

export const ProductionPage = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("CreateProduction");
  const canEdit = hasPermission("EditProduction");
  const canDelete = hasPermission("DeleteProduction");

  const [batches, setBatches] = useState([]);
  const [eggTypes, setEggTypes] = useState([]);
  const [productions, setProductions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  const [form, setForm] = useState({
    henBatchId: "",
    date: today,
    eggType: "",
    quantity: ""
  });

  const showSnack = (msg, severity = "success") =>
    setSnack({ open: true, msg, severity });

  const load = async () => {
    setLoading(true);
    try {
      const [b, p, et] = await Promise.all([
        getBatches(),
        getProductions({}),
        eggTypesApi.getAll(true) // solo activos
      ]);
      setBatches(b.data.filter(x => x.isActive));
      setProductions(p.data);
      setEggTypes(et);
      // Establecer tipo de huevo por defecto si hay tipos
      if (et.length > 0 && !form.eggType) {
        setForm(f => ({ ...f, eggType: et[0].name }));
      }
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
    setForm({ henBatchId: "", date: today, eggType: eggTypes[0]?.name || "", quantity: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.henBatchId || !form.quantity) return;

    setSaving(true);
    try {
      if (editing) {
        await updateProduction(editing.id, {
          henBatchId: form.henBatchId,
          date: form.date,
          eggType: form.eggType,
          quantity: Number(form.quantity)
        });
        showSnack("Registro actualizado.");
      } else {
        await registerProduction({
          henBatchId: form.henBatchId,
          date: form.date,
          eggType: form.eggType,
          quantity: Number(form.quantity)
        });
        showSnack("Registro creado.");
      }
      resetForm();
      await load();
    } catch (err) {
      const msg = err?.response?.data || "Error guardando registro.";
      showSnack(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (p) => {
    setEditing(p);
    setForm({
      henBatchId: p.henBatchId,
      date: p.date?.substring(0, 10) || today,
      eggType: p.eggType,
      quantity: p.quantity.toString()
    });
  };

  const handleDelete = async () => {
    try {
      await deleteProduction(confirmDelete.id);
      showSnack("Registro eliminado.");
      setConfirmDelete({ open: false, id: null });
      await load();
    } catch (err) {
      const msg = err?.response?.data || "Error eliminando registro.";
      showSnack(msg, "error");
    }
  };

  return (
    <Grid container spacing={3}>
      {(canCreate || editing) && (
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {editing ? "Editar registro" : "Registrar postura diaria"}
              </Typography>
              <Stack spacing={2} component="form" onSubmit={handleSubmit}>
                <TextField select label="Camada" name="henBatchId" value={form.henBatchId}
                  onChange={handleChange} fullWidth required>
                  {batches.map(b => (
                    <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                  ))}
                </TextField>

                <TextField label="Fecha" type="date" name="date"
                  value={form.date} onChange={handleChange} fullWidth
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ max: today }}
                />

                <TextField select label="Tipo de huevo" name="eggType"
                  value={form.eggType} onChange={handleChange} fullWidth>
                  {eggTypes.map(t => (
                    <MenuItem key={t.id} value={t.name}>{t.name}</MenuItem>
                  ))}
                </TextField>

                <TextField label="Cantidad" type="number" name="quantity"
                  value={form.quantity} onChange={handleChange} fullWidth required
                  inputProps={{ min: 1 }}
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
      )}

      <Grid item xs={12} md={(canCreate || editing) ? 8 : 12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Últimos registros</Typography>
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
                    <TableCell>Tipo</TableCell>
                    <TableCell align="right">Cantidad</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productions.map(p => {
                    const batch = batches.find(b => b.id === p.henBatchId);
                    return (
                      <TableRow key={p.id}>
                        <TableCell>{new Date(p.date).toLocaleDateString()}</TableCell>
                        <TableCell>{batch ? batch.name : "-"}</TableCell>
                        <TableCell>{p.eggType}</TableCell>
                        <TableCell align="right">{p.quantity}</TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(p)}
                            disabled={!canEdit}
                            title={canEdit ? "Editar" : "Sin permiso para editar"}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setConfirmDelete({ open: true, id: p.id })}
                            disabled={!canDelete}
                            title={canDelete ? "Eliminar" : "Sin permiso para eliminar"}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {productions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <Typography variant="body2" color="text.secondary">
                          Aún no hay registros.
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
        <DialogTitle>Eliminar registro</DialogTitle>
        <DialogContent>
          <Typography>¿Seguro que deseas eliminar este registro de producción?</Typography>
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
