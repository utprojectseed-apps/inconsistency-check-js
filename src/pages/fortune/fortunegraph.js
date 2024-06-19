import CSVReader from "../../components/csvread";
import React, { useEffect, useRef, useReducer } from "react";
import * as dfd from 'danfojs';
import ParticipantList from "../../game_data/participants";
import GraphFortuneData from "../../components/graph/graphfortunedata";

export default function FortuneGraph() {
    const [data, setData] = React.useState(undefined)
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    const participantList = useRef(null)
    const [errorMessage, setErrorMessage] = React.useState(undefined)   
    const handleUpload = d => {
        setData(d)
    }
    useEffect(() => {
        if(data !== undefined) {
            const subjects = data['subject_id']
            if(subjects === undefined) {
                setErrorMessage("No 'subject_id' column found in data, please make sure you have a fortune deck dataset.")
            } else {
                let participants = new dfd.Series(data['subject_id'].values).unique()
                participantList.current = new ParticipantList(participants, data)
                setErrorMessage(undefined)
            }
            forceUpdate()
        }
    }, [data])
    return (
        <div className='games'>
            <h1>Enter data</h1>
            <CSVReader parentCallback={handleUpload} gameId = "fortune"/>
            {errorMessage && <h2>{errorMessage}</h2>}
            <div>Test</div>
            {!errorMessage && <GraphFortuneData participantList={participantList.current}/>}
        </div>
    )
}