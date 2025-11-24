import React, { useState } from "react";
import { Grid, Card, CardContent, Typography, TextField, Button, Stack } from "@mui/material";
import { getMonthlyProfit } from "../api/reportsApi";

export const ReportsPage = () => {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth()+1);
  const [report, setReport] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await getMonthlyProfit(year, month);
    setReport(res.data);
  };

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={4}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Ganancia mensual</Typography>
            <Stack spacing={2} component="form" onSubmit={handleSubmit}>
              <TextField label="Año" type="number" value={year}
                onChange={(e)=>setYear(Number(e.target.value))} fullWidth />
              <TextField label="Mes" type="number" value={month}
                onChange={(e)=>setMonth(Number(e.target.value))} fullWidth inputProps={{min:1,max:12}} />
              <Button type="submit" variant="contained">Consultar</Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={8}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>Resultado</Typography>
            {report ? (
              <>
                <Typography>Periodo: {report.month}/{report.year}</Typography>
                <Typography>Ventas totales: <b>{report.totalSales.toFixed(2)}</b></Typography>
                <Typography>Costos insumos: <b>{report.totalSupplies.toFixed(2)}</b></Typography>
                <Typography>Ganancia: <b style={{ color: report.profit>=0 ? "green":"red" }}>{report.profit.toFixed(2)}</b></Typography>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary">Selecciona un mes y año.</Typography>
            )}
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};
