import * as dfd from 'danfojs'

// Papa Parse rows (header row first) -> DataFrame, exactly as an upload is read.
export default function rowsToFrame(lines) {
  const keys = lines[0];
  const array = [];
  for(let i = 1 ; i < lines.length; ++i) {
    const values = lines[i]
    const dict = {};
    for(let k = 0; k < keys.length; ++k) {
      dict[keys[k]] = values[k];
    }
    array.push(dict);
  }
  return new dfd.DataFrame(array)
}
