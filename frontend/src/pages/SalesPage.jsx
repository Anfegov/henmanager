import React, { useEffect, useMemo, useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  MenuItem,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Chip
} from "@mui/material";

import { getBatches } from "../api/batchesApi";
import { salesApi } from "../api/salesApi";
import { customersApi } from "../api/customersApi";
import axiosClient from "../api/axiosClient";

const eggTypes = ["Pequeno","Mediano","Grande","ExtraGrande","DobleYema","Roto"];

const paymentTypes = [
  { value: "Contado", label: "Contado" },
  { value: "Credito", label: "Crédito" }
];

export const SalesPage = () => {
  const [batches, setBatches] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [stockByType, setStockByType] = useState([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    henBatchId: "",
    customerId: "",
    eggType: "Mediano",
    date: new Date().toISOString().substring(0, 10),
    quantity: "",
    unitPrice: "",
    paymentType: "Contado"
  });

  const availableForType = useMemo(
    () => stockByType.find(x => x.eggType === form.eggType)?.available ?? 0,
    [stockByType, form.eggType]
  );

  const load = async () => {
    const [bRes, cRes, sRes] = await Promise.all([
      getBatches(),
      customersApi.getAll(),
      salesApi.getAll()
    ]);

    setBatches(bRes.data);
    setCustomers(cRes);
    setSales(sRes);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const run = async () => {
      if (!form.henBatchId) { setStockByType([]); return; }
      try {
        const res = await axiosClient.get("/stock", { params: { henBatchId: form.henBatchId }});
        setStockByType(res.data);
      } catch {
        setStockByType([]);
      }
    };
    run();
  }, [form.henBatchId]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.henBatchId || !form.customerId) return;

    const payload = {
      henBatchId: form.henBatchId,
      customerId: form.customerId,
      eggType: form.eggType,
      date: form.date,
      quantity: Number(form.quantity),
      unitPrice: Number(form.unitPrice),
      paymentType: form.paymentType
    };

    setSaving(true);
    try {
      await salesApi.register(payload);
      setForm(f => ({ ...f, quantity: "", unitPrice: "" }));
      await load();
      // refresh stock after sell
      const res = await axiosClient.get("/stock", { params: { henBatchId: form.henBatchId }});
      setStockByType(res.data);
    } catch (err) {
      alert(err?.response?.data || "Error registrando venta");
    } finally {
      setSaving(false);
    }
  };

  const batchName = (id) => batches.find(b => b.id === id)?.name ?? id;
  const customerName = (id) => customers.find(c => c.id === id)?.name ?? id;

  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6">Registrar venta</Typography>

            <Stack component="form" spacing={2} sx={{ mt: 2 }} onSubmit={onSubmit}>
              <TextField
                select
                label="Camada"
                value={form.henBatchId}
                onChange={(e) => setForm({ ...form, henBatchId: e.target.value })}
                required
              >
                {batches.map(b => (
                  <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Cliente"
                value={form.customerId}
                onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                required
              >
                {customers.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Tipo de huevo"
                value={form.eggType}
                onChange={(e) => setForm({ ...form, eggType: e.target.value })}
                required
              >
                {eggTypes.map(t => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </TextField>

              <Typography variant="caption" color="text.secondary">
                Stock disponible ({form.eggType}): {availableForType}
              </Typography>

              <TextField
                label="Fecha"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />

              <TextField
                label="Cantidad (panales)"
                type="number"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
                inputProps={{ min: 1 }}
              />

              <TextField
                label="Precio unitario"
                type="number"
                value={form.unitPrice}
                onChange={(e) => setForm({ ...form, unitPrice: e.target.value })}
                required
                inputProps={{ min: 0, step: "0.01" }}
              />

              <TextField
                select
                label="Tipo de pago"
                value={form.paymentType}
                onChange={(e) => setForm({ ...form, paymentType: e.target.value })}
                required
              >
                {paymentTypes.map(pt => (
                  <MenuItem key={pt.value} value={pt.value}>{pt.label}</MenuItem>
                ))}
              </TextField>

              <Button type="submit" variant="contained" disabled={saving}>
                {saving ? "Guardando..." : "Registrar venta"}
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6">Historial de ventas</Typography>

            <Table size="small" sx={{ mt: 2 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Camada</TableCell>
                  <TableCell>Cliente</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Cantidad</TableCell>
                  <TableCell>Precio</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Pago</TableCell>
                  <TableCell>Estado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sales.map(s => (
                  <TableRow key={s.id}>
                    <TableCell>{new Date(s.date).toLocaleDateString()}</TableCell>
                    <TableCell>{batchName(s.henBatchId)}</TableCell>
                    <TableCell>{customerName(s.customerId)}</TableCell>
                    <TableCell>{s.eggType ?? "-"}</TableCell>
                    <TableCell>{s.quantity}</TableCell>
                    <TableCell>${s.unitPrice}</TableCell>
                    <TableCell>${s.total}</TableCell>
                    <TableCell>
                      <Chip size="small" label={s.paymentType} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={s.creditStatus}
                        color={s.creditStatus === "Pendiente" ? "warning" : "success"}
                      />
                    </TableCell>
                  </TableRow>
                ))}
                {sales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9}>
                      <Typography variant="body2" color="text.secondary">
                        No hay ventas registradas.
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

export default SalesPage;