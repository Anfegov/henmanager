import React, { useEffect, useState } from "react";
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
import { eggTypesApi } from "../api/eggTypesApi";
import { useAuth } from "../auth/useAuth";

const emptyForm = {
  id: null,
  name: "",
  description: "",
  displayOrder: 0,
  isActive: true
};

export const EggTypesPage = () => {
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("CreateEggType");
  const canEdit = hasPermission("EditEggType");
  const canDelete = hasPermission("DeleteEggType");

  const [eggTypes, setEggTypes] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });

  const showSnack = (msg, severity = "success") =>
    setSnack({ open: true, msg, severity });

  const load = async () => {
    setLoading(true);
    try {
      const data = await eggTypesApi.getAll();
      setEggTypes(data ?? []);
    } catch (e) {
      showSnack("No fue posible cargar tipos de huevo.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleOpen = (eggType = null) => {
    if (!canCreate && !canEdit) return;
    if (eggType) setForm({
      id: eggType.id,
      name: eggType.name ?? "",
      description: eggType.description ?? "",
      displayOrder: eggType.displayOrder ?? 0,
      isActive: eggType.isActive ?? true
    });
    else setForm(emptyForm);
    setOpen(true);
  };

  const handleSave = async () => {
    if (!canCreate && !canEdit) return;
    if (!form.name.trim()) {
      showSnack("El nombre es obligatorio.", "warning");
      return;
    }
    try {
      if (form.id) {
        await eggTypesApi.update(form.id, {
          name: form.name.trim(),
          description: form.description?.trim() || null,
          displayOrder: form.displayOrder,
          isActive: form.isActive
        });
        showSnack("Tipo de huevo actualizado.");
      } else {
        await eggTypesApi.create({
          name: form.name.trim(),
          description: form.description?.trim() || null,
          displayOrder: form.displayOrder
        });
        showSnack("Tipo de huevo creado.");
      }
      setOpen(false);
      setForm(emptyForm);
      await load();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data || "Error guardando tipo de huevo.";
      showSnack(msg, "error");
    }
  };

  const handleDelete = async (id) => {
    if (!canDelete) return;
    if (!confirm("¿Desactivar este tipo de huevo?")) return;
    try {
      await eggTypesApi.remove(id);
      showSnack("Tipo de huevo desactivado.");
      await load();
    } catch (e) {
      const msg = e?.response?.data?.message || e?.response?.data || "No fue posible desactivar.";
      showSnack(msg, "error");
    }
  };

  const activeCount = eggTypes.filter(e => e.isActive).length;

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Card>
          <CardContent sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <Typography variant="h6">Tipos de Huevo</Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                <Chip label={`Total: ${eggTypes.length}`} />
                <Chip color="success" label={`Activos: ${activeCount}`} />
                <Chip label={`Inactivos: ${eggTypes.length - activeCount}`} />
              </Stack>
            </div>
            {canCreate && (
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
                  <TableCell>Orden</TableCell>
                  <TableCell>Nombre</TableCell>
                  <TableCell>Descripcion</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell align="right">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {eggTypes.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{e.displayOrder}</TableCell>
                    <TableCell>{e.name}</TableCell>
                    <TableCell>{e.description || "-"}</TableCell>
                    <TableCell>
                      {e.isActive ? (
                        <Chip size="small" color="success" label="Activo" />
                      ) : (
                        <Chip size="small" label="Inactivo" />
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        disabled={!canEdit}
                        onClick={() => handleOpen(e)}
                        title={canEdit ? "Editar" : "Sin permiso para editar"}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        disabled={!canDelete}
                        color="error"
                        onClick={() => handleDelete(e.id)}
                        title={canDelete ? "Eliminar" : "Sin permiso para eliminar"}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {eggTypes.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      No hay tipos de huevo registrados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{form.id ? "Editar tipo de huevo" : "Nuevo tipo de huevo"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Descripcion"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              fullWidth
            />
            <TextField
              label="Orden de visualizacion"
              type="number"
              value={form.displayOrder}
              onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })}
              fullWidth
              inputProps={{ min: 0 }}
            />
            {form.id && (
              <FormControlLabel
                control={
                  <Switch
                    checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  />
                }
                label="Activo"
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSave}>Guardar</Button>
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

export default EggTypesPage;
