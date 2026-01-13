import React, { useContext, useEffect, useState } from "react";
import {
  Grid, Card, CardContent, Typography, Stack, Table, TableHead, TableRow, TableCell,
  TableBody, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Collapse, Box, Chip, Snackbar, Alert, CircularProgress
} from "@mui/material";
import PaidIcon from "@mui/icons-material/Paid";
import HistoryIcon from "@mui/icons-material/History";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { creditsApi } from "../api/creditsApi";
import { paymentsApi } from "../api/paymentsApi";
import { AuthContext } from "../auth/AuthContext";

export const CreditsPage = () => {
  const { hasPermission } = useContext(AuthContext);
  const [summary, setSummary] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [openPay, setOpenPay] = useState(false);
  const [paySale, setPaySale] = useState(null);
  const [amount, setAmount] = useState("");
  const [snack, setSnack] = useState({ open: false, msg: "", severity: "success" });
  const [historyDialog, setHistoryDialog] = useState({ open: false, saleId: null, saleDate: null });
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const showSnack = (msg, severity = "success") =>
    setSnack({ open: true, msg, severity });

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
      showSnack("Monto inválido", "warning");
      return;
    }
    try {
      await paymentsApi.register(paySale.saleId, val);
      setOpenPay(false);
      showSnack("Abono registrado correctamente.");
      await load();
    } catch (e) {
      showSnack(e?.response?.data || "Error registrando abono", "error");
    }
  };

  const openHistory = async (sale) => {
    setHistoryDialog({ open: true, saleId: sale.saleId, saleDate: sale.date });
    setLoadingHistory(true);
    try {
      const history = await paymentsApi.getHistory(sale.saleId);
      setPaymentHistory(history);
    } catch (e) {
      showSnack("Error cargando historial", "error");
      setPaymentHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const canRegisterPayment = hasPermission("RegisterPayment");

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
                                  <TableCell align="right">Acciones</TableCell>
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
                                      <Stack direction="row" spacing={1} justifyContent="flex-end">
                                        <IconButton size="small" onClick={() => openHistory(s)} title="Ver historial">
                                          <HistoryIcon fontSize="small" />
                                        </IconButton>
                                        {canRegisterPayment && s.pendingAmount > 0 && (
                                          <Button size="small" startIcon={<PaidIcon/>}
                                            onClick={() => openPayment(s)}>
                                            Abonar
                                          </Button>
                                        )}
                                      </Stack>
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
              type="number" inputProps={{ min: 0.01, step: "0.01" }} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPay(false)}>Cancelar</Button>
          <Button variant="contained" onClick={savePayment}>Guardar</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={historyDialog.open}
        onClose={() => setHistoryDialog({ open: false, saleId: null, saleDate: null })}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Historial de abonos
          {historyDialog.saleDate && (
            <Typography variant="body2" color="text.secondary">
              Venta del {new Date(historyDialog.saleDate).toLocaleDateString()}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent>
          {loadingHistory ? (
            <Stack alignItems="center" py={3}>
              <CircularProgress />
            </Stack>
          ) : paymentHistory.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>
              No hay abonos registrados para esta venta.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Fecha</TableCell>
                  <TableCell align="right">Monto</TableCell>
                  <TableCell>Registrado por</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paymentHistory.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{new Date(p.paidAt).toLocaleString()}</TableCell>
                    <TableCell align="right">${p.amount.toFixed(2)}</TableCell>
                    <TableCell>{p.paidByName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialog({ open: false, saleId: null, saleDate: null })}>
            Cerrar
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

export default CreditsPage;
