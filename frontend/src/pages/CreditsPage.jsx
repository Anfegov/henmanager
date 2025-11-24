import React, { useEffect, useState } from "react";
import {
  Grid, Card, CardContent, Typography, Stack, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Collapse, Box, Chip
} from "@mui/material";
import PaidIcon from "@mui/icons-material/Paid";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { creditsApi } from "../api/creditsApi";
import { paymentsApi } from "../api/paymentsApi";

export const CreditsPage = () => {
  const [summary, setSummary] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [openPay, setOpenPay] = useState(false);
  const [paySale, setPaySale] = useState(null);
  const [amount, setAmount] = useState("");

  const load = async () => {
    const [s, c] = await Promise.all([
      creditsApi.getSummary(),
      creditsApi.getCustomersInDebt()
    ]);
    setSummary(s);
    setCustomers(c);
  };

  useEffect(() => { load(); }, []);

  const toggle = (custId) => {
    setExpanded(e => ({ ...e, [custId]: !e[custId] }));
  };

  const openPayment = (sale) => {
    setPaySale(sale);
    setAmount("");
    setOpenPay(true);
  };

  const savePayment = async () => {
    if (!paySale) return;
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) {
      alert("Monto inválido");
      return;
    }
    try {
      await paymentsApi.create(paySale.saleId, { amount: val });
      setOpenPay(false);
      await load();
    } catch (e) {
      alert(e?.response?.data || "Error registrando abono");
    }
  };

  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Card>
          <CardContent>
            <Typography variant="h5">Cartera / Créditos</Typography>
            {summary && (
              <Stack direction={{ xs:"column", sm:"row" }} spacing={2} sx={{ mt: 2 }}>
                <Chip label={`Deuda total: $${summary.totalDebt.toFixed(2)}`} />
                <Chip color="success" label={`Pagado: $${summary.totalPaid.toFixed(2)}`} />
                <Chip color="warning" label={`Pendiente: $${summary.totalPending.toFixed(2)}`} />
                <Chip label={`Clientes en deuda: ${summary.countCustomersInDebt}`} />
              </Stack>
            )}

            <Table sx={{ mt: 3 }}>
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell>Cliente</TableCell>
                  <TableCell align="right">Deuda total</TableCell>
                  <TableCell align="right">Pagado</TableCell>
                  <TableCell align="right">Pendiente</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.map(c => (
                  <React.Fragment key={c.customerId}>
                    <TableRow hover>
                      <TableCell width={40}>
                        <IconButton size="small" onClick={() => toggle(c.customerId)}>
                          {expanded[c.customerId] ? <ExpandLessIcon/> : <ExpandMoreIcon/>}
                        </IconButton>
                      </TableCell>
                      <TableCell>{c.customerName}</TableCell>
                      <TableCell align="right">${c.totalDebt.toFixed(2)}</TableCell>
                      <TableCell align="right">${c.totalPaid.toFixed(2)}</TableCell>
                      <TableCell align="right">${c.totalPending.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={5}>
                        <Collapse in={expanded[c.customerId]} timeout="auto" unmountOnExit>
                          <Box sx={{ m: 1 }}>
                            <Typography variant="subtitle1" sx={{ mb:1 }}>Ventas a crédito</Typography>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Fecha</TableCell>
                                  <TableCell align="right">Total</TableCell>
                                  <TableCell align="right">Pagado</TableCell>
                                  <TableCell align="right">Pendiente</TableCell>
                                  <TableCell>Estado</TableCell>
                                  <TableCell align="right">Abono</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {c.sales.map(s => (
                                  <TableRow key={s.saleId}>
                                    <TableCell>{new Date(s.date).toLocaleDateString()}</TableCell>
                                    <TableCell align="right">${s.total.toFixed(2)}</TableCell>
                                    <TableCell align="right">${s.amountPaid.toFixed(2)}</TableCell>
                                    <TableCell align="right">${s.pendingAmount.toFixed(2)}</TableCell>
                                    <TableCell>{s.creditStatus}</TableCell>
                                    <TableCell align="right">
                                      {s.pendingAmount > 0 && (
                                        <Button size="small" startIcon={<PaidIcon/>}
                                          onClick={() => openPayment(s)}>
                                          Abonar
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>

          </CardContent>
        </Card>
      </Grid>

      <Dialog open={openPay} onClose={() => setOpenPay(false)} fullWidth maxWidth="xs">
        <DialogTitle>Registrar abono</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt:1 }}>
            <Typography variant="body2">
              Pendiente actual: ${paySale?.pendingAmount?.toFixed(2)}
            </Typography>
            <TextField label="Monto" value={amount} onChange={(e)=>setAmount(e.target.value)}
              type="number" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPay(false)}>Cancelar</Button>
          <Button variant="contained" onClick={savePayment}>Guardar</Button>
        </DialogActions>
      </Dialog>
    </Grid>
  );
};

export default CreditsPage;
