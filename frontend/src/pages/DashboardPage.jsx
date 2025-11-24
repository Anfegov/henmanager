import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/useAuth";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  TextField,
  MenuItem,
  Stack,
  LinearProgress,
  Box
} from "@mui/material";
import { getBatches } from "../api/batchesApi";
import axiosClient from "../api/axiosClient";

const eggTypes = ["Pequeno","Mediano","Grande","ExtraGrande","DobleYema","Roto"];
const LOW_STOCK_THRESHOLD = 10; // panales

export const DashboardPage = () => {
  const { user } = useAuth();

  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [stockByType, setStockByType] = useState([]);

  const loadBatches = async () => {
    try {
      const res = await getBatches();
      const list = res.data ?? [];
      setBatches(list);
      const active = list.find(b => b.isActive) ?? list[0];
      if (active && !selectedBatchId) setSelectedBatchId(active.id);
    } catch {
      setBatches([]);
    }
  };

  const loadStock = async (henBatchId) => {
    if (!henBatchId) { setStockByType([]); return; }
    try {
      const res = await axiosClient.get("/stock", { params: { henBatchId } });
      setStockByType(res.data ?? []);
    } catch {
      setStockByType([]);
    }
  };

  useEffect(() => { loadBatches(); }, []);
  useEffect(() => { loadStock(selectedBatchId); }, [selectedBatchId]);

  const stockMap = useMemo(() => {
    const m = {};
    for (const t of eggTypes) m[t] = { eggType: t, available: 0, produced: 0, sold: 0 };
    (stockByType || []).forEach(s => { m[s.eggType] = s; });
    return eggTypes.map(t => m[t]);
  }, [stockByType]);

  const maxAvailable = Math.max(1, ...stockMap.map(s => s.available));

  const lowStockTypes = stockMap.filter(s => s.available <= LOW_STOCK_THRESHOLD);

  return (
    <Grid container spacing={3}>
      <Grid item xs={12}>
        <Typography variant="h4" gutterBottom>
          Bienvenido, {user?.userName}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Aquí puedes gestionar camadas, registrar postura diaria, ventas,
          insumos y consultar reportes de ganancia.
        </Typography>
      </Grid>

      {/* Stock by type card */}
      <Grid item xs={12} md={7}>
        <Card>
          <CardContent>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="center" justifyContent="space-between">
              <Typography variant="h6">Stock por tipo de huevo</Typography>

              <TextField
                select
                label="Camada"
                size="small"
                value={selectedBatchId}
                onChange={(e) => setSelectedBatchId(e.target.value)}
                sx={{ minWidth: 220 }}
              >
                {batches.map(b => (
                  <MenuItem key={b.id} value={b.id}>
                    {b.name} {b.isActive ? "(Activa)" : ""}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Stack spacing={2} sx={{ mt: 2 }}>
              {stockMap.map(s => {
                const pct = (s.available / maxAvailable) * 100;
                const low = s.available <= LOW_STOCK_THRESHOLD;
                return (
                  <Box key={s.eggType}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography variant="subtitle2">
                        {s.eggType}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" color="text.secondary">
                          Prod: {s.produced} | Vend: {s.sold}
                        </Typography>
                        <Chip
                          size="small"
                          label={`Disp: ${s.available}`}
                          color={low ? "warning" : "default"}
                        />
                      </Stack>
                    </Stack>
                    <LinearProgress variant="determinate" value={pct} />
                  </Box>
                );
              })}
              {stockMap.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No hay stock para mostrar.
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      {/* Low stock alerts */}
      <Grid item xs={12} md={5}>
        <Card>
          <CardContent>
            <Typography variant="h6">Alertas de stock bajo</Typography>

            {lowStockTypes.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Todo bien por ahora 🤘 No hay tipos con stock bajo.
              </Typography>
            ) : (
              <Stack spacing={1} sx={{ mt: 1 }}>
                {lowStockTypes.map(s => (
                  <Card key={`low-${s.eggType}`} variant="outlined" sx={{ p: 1.5 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle1" fontWeight={600}>
                        {s.eggType}
                      </Typography>
                      <Chip size="small" color="warning" label={`Disp: ${s.available}`} />
                    </Stack>
                    <Typography variant="caption" color="text.secondary">
                      Producción: {s.produced} | Vendido: {s.sold}
                    </Typography>
                  </Card>
                ))}
              </Stack>
            )}

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: "block" }}>
              Umbral de alerta: ≤ {LOW_STOCK_THRESHOLD} panales.
            </Typography>
          </CardContent>
        </Card>
      </Grid>

      {/* Permissions card (existing) */}
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h6">Permisos del usuario</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Estos son los permisos resultantes del merge de roles.
            </Typography>
            <div style={{ marginTop: 8, display: "flex", flexWrap: "wrap", gap: 8 }}>
              {user?.permissions?.map((p) => (
                <Chip key={p} label={p} size="small" />
              ))}
            </div>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};