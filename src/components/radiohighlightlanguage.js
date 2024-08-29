import * as React from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';

export default function RadioHighlightReport({ parentCallback, value }) {
  return (
    <FormControl>
      <FormLabel id="demo-row-radio-buttons-group-label">Report Selection</FormLabel>
      <RadioGroup
        row
        aria-labelledby="demo-row-radio-buttons-group-label"
        name="row-controlled-radio-buttons-group"
        value={value}
        onChange={(event) => parentCallback(event.target.value)}
      >
        <FormControlLabel value="eng" control={<Radio />} label="English" />
        <FormControlLabel value="span" control={<Radio />} label="Spanish" />
      </RadioGroup>
    </FormControl>
  );
}