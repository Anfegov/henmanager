import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
  CircularProgress
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { getBatches, createBatch, updateBatch, closeBatch } from "../api/batchesApi";
import { useAuth } from "../auth/useAuth";

const today = new Date().toISOString().slice(0, 10);

export const BatchesPage = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("CreateBatch");
  const canEdit = hasPermission("EditBatch");
  const canClose = hasPermission("CloseBatch");

  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editDialog, setEditDialog] = useState({ open: false, batch: null });
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  const [form, setForm] = useState({
    name: "",
    startDate: today,
    hensCount: 0
  });

  const [editForm, setEditForm] = useState({
    name: "",
    startDate: "",
    hensCount: 0,
    notes: ""
  });

  const showSnack = (msg, severity = "success") =>
    setSnack({ open: true, msg, severity });

  const loadBatches = async () => {
    setLoading(true);
    try {
      const res = await getBatches();
      setBatches(res.data ?? []);
    } catch (err) {
      showSnack("Error cargando camadas.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBatches(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "hensCount" ? Number(value) : value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((f) => ({ ...f, [name]: name === "hensCount" ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (!form.startDate) return;
    if (form.hensCount <= 0) return;

    setSaving(true);
    try {
      await createBatch({
        name: form.name.trim(),
        startDate: form.startDate,
        hensCount: form.hensCount
      });
      showSnack("Camada creada.");
      setForm((f) => ({ ...f, name: "", hensCount: 0 }));
      await loadBatches();
    } catch (err) {
      const msg = err?.response?.data || "Error creando camada.";
      showSnack(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (id) => {
    if (!confirm("¿Seguro que deseas cerrar esta camada? Esta acción no se puede deshacer.")) return;
    try {
      await closeBatch(id);
      showSnack("Camada cerrada.");
      await loadBatches();
    } catch (err) {
      const msg = err?.response?.data || "Error cerrando camada.";
      showSnack(msg, "error");
    }
  };

  const openEditDialog = (batch) => {
    setEditDialog({ open: true, batch });
    setEditForm({
      name: batch.name,
      startDate: batch.startDate?.substring(0, 10) || today,
      hensCount: batch.hensCount || 0,
      notes: batch.notes || ""
    });
  };

  const handleEditSubmit = async () => {
    if (!editForm.name.trim()) {
      showSnack("El nombre es obligatorio.", "warning");
      return;
    }

    setSaving(true);
    try {
      await updateBatch(editDialog.batch.id, {
        name: editForm.name.trim(),
        startDate: editForm.startDate,
        hensCount: editForm.hensCount,
        notes: editForm.notes.trim() || null
      });
      showSnack("Camada actualizada.");
      setEditDialog({ open: false, batch: null });
      await loadBatches();
    } catch (err) {
      const msg = err?.response?.data || "Error actualizando camada.";
      showSnack(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const activeCount = useMemo(() => batches.filter(b => b.isActive).length, [batches]);

  return (
    <Grid container spacing={3}>
      {canCreate && (
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>Nueva camada</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Registra una nueva camada/lote de gallinas para controlar su postura.
              </Typography>

              <Stack component="form" spacing={2} onSubmit={handleSubmit}>
                <TextField
                  label="Nombre de la camada"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />

                <TextField
                  label="Fecha de inicio"
                  name="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={handleChange}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{ max: today }}
                  required
                />

                <TextField
                  label="Cantidad inicial de gallinas"
                  name="hensCount"
                  type="number"
                  value={form.hensCount}
                  onChange={handleChange}
                  inputProps={{ min: 1 }}
                  required
                />

                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading || saving}
                >
                  {saving ? "Guardando..." : "Guardar camada"}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="subtitle2" color="text.secondary">Resumen</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip label={`Total: ${batches.length}`} />
                <Chip color="success" label={`Activas: ${activeCount}`} />
                <Chip color="default" label={`Cerradas: ${batches.length - activeCount}`} />
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      )}

      <Grid item xs={12} md={canCreate ? 8 : 12}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Camadas registradas</Typography>
            <Divider sx={{ mb: 2 }} />
            {loading ? (
              <Stack alignItems="center" py={4}>
                <CircularProgress />
              </Stack>
            ) : (
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Nombre</TableCell>
                      <TableCell>Inicio</TableCell>
                      <TableCell align="right">Gallinas</TableCell>
                      <TableCell>Notas</TableCell>
                      <TableCell>Estado</TableCell>
                      <TableCell align="right">Acciones</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {batches.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>{b.name}</TableCell>
                        <TableCell>{new Date(b.startDate).toLocaleDateString()}</TableCell>
                        <TableCell align="right">{b.hensCount}</TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {b.notes || "-"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {b.isActive ? (
                            <Chip size="small" color="success" label="Activa" />
                          ) : (
                            <Chip size="small" label="Cerrada" />
                          )}
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                            size="small"
                            onClick={() => openEditDialog(b)}
                            disabled={!canEdit}
                            title={canEdit ? "Editar" : "Sin permiso para editar"}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          {b.isActive && canClose && (
                            <Button
                              size="small"
                              color="warning"
                              variant="outlined"
                              onClick={() => handleClose(b.id)}
                              sx={{ ml: 1 }}
                            >
                              Cerrar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {batches.length === 0 && !loading && (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          Aún no hay camadas registradas.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            )}
          </CardContent>
        </Card>
      </Grid>

      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, batch: null })} fullWidth maxWidth="sm">
        <DialogTitle>Editar camada</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre"
              name="name"
              value={editForm.name}
              onChange={handleEditChange}
              fullWidth
              required
            />
            <TextField
              label="Fecha de inicio"
              name="startDate"
              type="date"
              value={editForm.startDate}
              onChange={handleEditChange}
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: today }}
              fullWidth
            />
            <TextField
              label="Cantidad de gallinas"
              name="hensCount"
              type="number"
              value={editForm.hensCount}
              onChange={handleEditChange}
              inputProps={{ min: 0 }}
              fullWidth
            />
            <TextField
              label="Notas"
              name="notes"
              value={editForm.notes}
              onChange={handleEditChange}
              fullWidth
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, batch: null })}>Cancelar</Button>
          <Button variant="contained" onClick={handleEditSubmit} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
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
