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
        <FormControlLabel value="first-week" control={<Radio />} label="Week 1 / Day 8" />
        <FormControlLabel value="second-week" control={<Radio />} label="Week 2 / Day 15" />
      </RadioGroup>
    </FormControl>
  );
}