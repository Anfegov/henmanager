import React, { useEffect, useState } from "react";
import {
  Grid, Card, CardContent, Typography, TextField, Button, Stack, MenuItem,
  Table, TableHead, TableRow, TableCell, TableBody
} from "@mui/material";
import { getBatches } from "../api/batchesApi";
import { getProductions, registerProduction } from "../api/productionApi";

const eggTypes = ["Pequeno","Mediano","Grande","ExtraGrande","DobleYema","Roto"];

export const ProductionPage = () => {
  const [batches, setBatches] = useState([]);
  const [productions, setProductions] = useState([]);
  const [form, setForm] = useState({
    henBatchId: "",
    date: new Date().toISOString().substring(0, 10),
    eggType: "Mediano",
    quantity: ""
  });

  const load = async () => {
    const b = await getBatches();
    setBatches(b.data.filter(x => x.isActive));
    const p = await getProductions({});
    setProductions(p.data);
  };

  useEffect(() => { load(); }, []);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    await registerProduction({
      henBatchId: form.henBatchId,
      date: form.date,
      eggType: form.eggType,
      quantity: Number(form.quantity)
    });
    setForm(f => ({ ...f, quantity: "" }));
    const p = await getProductions({});
    setProductions(p.data);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Registrar postura diaria</Typography>
            <Stack spacing={2} component="form" onSubmit={handleSubmit}>
              <TextField select label="Camada" name="henBatchId" value={form.henBatchId}
                onChange={handleChange} fullWidth required>
                {batches.map(b => (
                  <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                ))}
              </TextField>

              <TextField label="Fecha" type="date" name="date"
                value={form.date} onChange={handleChange} fullWidth
                InputLabelProps={{ shrink: true }} />

              <TextField select label="Tipo de huevo" name="eggType"
                value={form.eggType} onChange={handleChange} fullWidth>
                {eggTypes.map(t => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </TextField>

              <TextField label="Cantidad" type="number" name="quantity"
                value={form.quantity} onChange={handleChange} fullWidth required />

              <Button type="submit" variant="contained">Guardar</Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Últimos registros</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Camada</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell align="right">Cantidad</TableCell>
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
                    </TableRow>
                  );
                })}
                {productions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <Typography variant="body2" color="text.secondary">
                        Aún no hay registros.
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
