import * as React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';


function createData(name, gain, loss, percentageOfLoss, netgain) {
    return {name, gain, loss, percentageOfLoss, netgain};
}

const rows = [
    createData('Deck A', "+250", "-150 to -350", "50%", "-250"),
    createData('Deck B', "+250", -1250, "10%", -250),
    createData('Deck C', "+100", "-25 to -75", "50%", "+250"),
    createData('Deck D', "+100", "-250", "10%", "+250"),
  ];

const CustomTableCell = styled(TableCell)({
    fontSize: '1rem',
});

export default function DeckExplanation() {
    return (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow sx={{
                  fontSize: '1.2rem',
                }}>
                <CustomTableCell>Deck Name</CustomTableCell>
                <CustomTableCell align="right">Raw Gain Per Card Draw</CustomTableCell>
                <CustomTableCell align="right">Potential Loss Per Card Draw</CustomTableCell>
                <CustomTableCell align="right">Percentage of Loss Occurance</CustomTableCell>
                <CustomTableCell align="right">Net Value of 10 Card Draws</CustomTableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.name}
                  sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                >
                  <CustomTableCell component="th" scope="row">
                    {row.name}
                  </CustomTableCell>
                  <CustomTableCell align="right">{row.gain}</CustomTableCell>
                  <CustomTableCell align="right">{row.loss}</CustomTableCell>
                  <CustomTableCell align="right">{row.percentageOfLoss}</CustomTableCell>
                  <CustomTableCell align="right">{row.netgain}</CustomTableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
    );
}