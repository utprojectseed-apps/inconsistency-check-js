import CSVReader from "../../components/csvread";
import React, { useEffect, useRef, useReducer } from "react";
import { NavLink } from "react-router-dom";
import * as dfd from 'danfojs';
import ParticipantList from "../../game_data/participants";
import GamesFullReport from "../../components/gamesfullreport";
import CheckboxesTags from "../../components/checkboxestags";

export default function FortuneGame() {
    const [data, setData] = React.useState(undefined)
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    const participantList = useRef(null)
    const [errorMessage, setErrorMessage] = React.useState(undefined)   
    const [selectedIds, setSelectedIds] = React.useState(undefined)
    const handleUpload = d => {
        setData(d)
    }
    const handleSelected = d => {
        setSelectedIds(d)
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
            <h1 className='no-print'>Enter data</h1>
            <div className='no-print'>
                <CSVReader parentCallback={handleUpload} gameId = "fortune"/>
                {new Date().getDay() === 1 && <NavLink to="../highlight">Click here to go to highlights page</NavLink>}
            </div>
            {errorMessage && <h2>{errorMessage}</h2>}
            {participantList.current !== null && 
                <div className='no-print'>
                    <CheckboxesTags className="no-print" ids={participantList.current.getIds()} parentCallback={handleSelected}/>
                </div>
            }
            {!errorMessage && <GamesFullReport participantList={participantList.current} activeIds={selectedIds}/>}
        </div>
    )
}