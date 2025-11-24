import React, { useEffect, useState } from "react";
import {
  Grid, Card, CardContent, Typography, TextField, Button, Stack, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody
} from "@mui/material";
import { getBatches } from "../api/batchesApi";
import { getSupplies, registerSupply } from "../api/suppliesApi";

export const SuppliesPage = () => {
  const [batches, setBatches] = useState([]);
  const [supplies, setSupplies] = useState([]);
  const [form, setForm] = useState({
    henBatchId: "",
    date: new Date().toISOString().substring(0, 10),
    name: "",
    quantity: "",
    unit: "kg",
    unitCost: ""
  });

  const load = async () => {
    const b = await getBatches();
    setBatches(b.data.filter(x => x.isActive));
    const s = await getSupplies({});
    setSupplies(s.data);
  };

  useEffect(() => { load(); }, []);
  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    await registerSupply({
      henBatchId: form.henBatchId,
      date: form.date,
      name: form.name,
      quantity: Number(form.quantity),
      unit: form.unit,
      unitCost: Number(form.unitCost)
    });
    setForm(f => ({ ...f, name:"", quantity:"", unitCost:"" }));
    const s = await getSupplies({});
    setSupplies(s.data);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Registrar insumo</Typography>
            <Stack spacing={2} component="form" onSubmit={handleSubmit}>
              <TextField select label="Camada" name="henBatchId"
                value={form.henBatchId} onChange={handleChange} fullWidth required>
                {batches.map(b => (
                  <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                ))}
              </TextField>

              <TextField label="Fecha" type="date" name="date"
                value={form.date} onChange={handleChange} fullWidth
                InputLabelProps={{ shrink: true }} />

              <TextField label="Insumo" name="name"
                value={form.name} onChange={handleChange} fullWidth required />

              <TextField label="Cantidad" type="number" name="quantity"
                value={form.quantity} onChange={handleChange} fullWidth required />

              <TextField label="Unidad" name="unit"
                value={form.unit} onChange={handleChange} fullWidth />

              <TextField label="Costo unitario" type="number" name="unitCost"
                value={form.unitCost} onChange={handleChange} fullWidth required />

              <Button type="submit" variant="contained">Guardar</Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Últimos insumos</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Camada</TableCell>
                  <TableCell>Insumo</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
                  <TableCell align="right">Unitario</TableCell>
                  <TableCell align="right">Total</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {supplies.map(s => {
                  const batch = batches.find(b => b.id === s.henBatchId);
                  const total = s.quantity * s.unitCost;
                  return (
                    <TableRow key={s.id}>
                      <TableCell>{new Date(s.date).toLocaleDateString()}</TableCell>
                      <TableCell>{batch ? batch.name : "-"}</TableCell>
                      <TableCell>{s.name}</TableCell>
                      <TableCell align="right">{s.quantity}</TableCell>
                      <TableCell align="right">{Number(s.unitCost).toFixed(2)}</TableCell>
                      <TableCell align="right">{Number(total).toFixed(2)}</TableCell>
                    </TableRow>
                  );
                })}
                {supplies.length===0 && (
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
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};
