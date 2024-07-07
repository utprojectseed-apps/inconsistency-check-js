import * as React from 'react';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';

export default function RadioHighlightReport() {
  return (
    <FormControl>
      <FormLabel id="demo-row-radio-buttons-group-label">Report Selection</FormLabel>
      <RadioGroup
        row
        aria-labelledby="demo-row-radio-buttons-group-label"
        name="row-radio-buttons-group"
        defaultValue="first-week"
      >
        <FormControlLabel value="first-week" control={<Radio />} label="First week report" />
        <FormControlLabel value="second-week" control={<Radio />} label="Last report" />
      </RadioGroup>
    </FormControl>
  );
}