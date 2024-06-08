import React from 'react';
import * as dfd from 'danfojs'
import { useCSVReader } from 'react-papaparse';

const styles = {
  csvReader: {
    display: 'flex',
    flexDirection: 'row',
    marginBottom: 10,
  },
  browseFile: {
    width: '20%',
  },
  acceptedFile: {
    border: '1px solid #ccc',
    height: 45,
    lineHeight: 2.5,
    paddingLeft: 10,
    width: '80%',
  },
  remove: {
    borderRadius: 0,
    padding: '0 20px',
  },
  progressBarBackgroundColor: {
    backgroundColor: 'red',
  },
};

export default function CSVReader({parentCallback}) {
  const { CSVReader } = useCSVReader();
  

  return (
    <CSVReader
      onUploadAccepted={(results) => {
        const lines = results.data
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
        let df = new dfd.DataFrame(array)
        parentCallback(df)
      }}
    >
      {({
        getRootProps,
        acceptedFile,
        ProgressBar,
        getRemoveFileProps,
      }) => (
        <>
          <div style={styles.csvReader}>
            <button type='button' {...getRootProps()} style={styles.browseFile}>
              Browse file
            </button>
            <div style={styles.acceptedFile}>
              {acceptedFile && acceptedFile.name}
            </div>
            <button {...getRemoveFileProps()} style={styles.remove}>
              Remove
            </button>
          </div>
          <ProgressBar style={styles.progressBarBackgroundColor} />
        </>
      )}
    </CSVReader>
  );
}