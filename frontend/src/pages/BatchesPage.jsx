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
  Typography
} from "@mui/material";
import { getBatches, createBatch, closeBatch } from "../api/batchesApi";

export const BatchesPage = () => {
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    startDate: new Date().toISOString().slice(0, 10),
    initialHenCount: 0
  });

  const loadBatches = async () => {
    setLoading(true);
    try {
      const res = await getBatches();
      setBatches(res.data ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBatches(); }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "initialHenCount" ? Number(value) : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (!form.startDate) return;
    if (form.initialHenCount <= 0) return;

    await createBatch({
      name: form.name.trim(),
      startDate: form.startDate,
      initialHenCount: form.initialHenCount
    });

    setForm((f) => ({ ...f, name: "", initialHenCount: 0 }));
    await loadBatches();
  };

  const handleClose = async (id) => {
    await closeBatch(id);
    await loadBatches();
  };

  const activeCount = useMemo(() => batches.filter(b => b.isActive).length, [batches]);

  return (
    <Grid container spacing={3}>
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
                required
              />

              <TextField
                label="Cantidad inicial de gallinas"
                name="initialHenCount"
                type="number"
                value={form.initialHenCount}
                onChange={handleChange}
                inputProps={{ min: 1 }}
                required
              />

              <Button
                type="submit"
                variant="contained"
                disabled={loading}
              >
                Guardar camada
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

      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Camadas registradas</Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nombre</TableCell>
                    <TableCell>Inicio</TableCell>
                    <TableCell align="right">Gallinas iniciales</TableCell>
                    <TableCell>Estado</TableCell>
                    <TableCell align="right">Acciones</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {batches.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>{b.name}</TableCell>
                      <TableCell>{new Date(b.startDate).toLocaleDateString()}</TableCell>
                      <TableCell align="right">{b.initialHenCount}</TableCell>
                      <TableCell>
                        {b.isActive ? (
                          <Chip size="small" color="success" label="Activa" />
                        ) : (
                          <Chip size="small" label="Cerrada" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {b.isActive && (
                          <Button
                            size="small"
                            color="warning"
                            variant="outlined"
                            onClick={() => handleClose(b.id)}
                          >
                            Cerrar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {batches.length === 0 && !loading && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        Aún no hay camadas registradas.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};
