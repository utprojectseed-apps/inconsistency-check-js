import CSVReader from "./csvread";
import React, { useEffect, useRef, useReducer } from "react";
import * as dfd from 'danfojs';
import ParticipantList from "../../game_data/participants";
import GamesFullReport from "../../components/gamesfullreport";

export default function FortuneGame() {
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
            <CSVReader parentCallback={handleUpload}/>
            {errorMessage && <h2>{errorMessage}</h2>}
            {!errorMessage && <GamesFullReport participantList={participantList.current}/>}
        </div>
    )
}