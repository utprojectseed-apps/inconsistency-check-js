/* eslint-disable */ //TODO: remove once started implementing
import CSVReader from "../../components/csvread";
import React, { useEffect, useRef, useReducer } from "react";
import * as dfd from 'danfojs';
import ParticipantList from "../../game_data/participants";
import GamesFullReport from "../../components/gamesfullreport";

export default function CognitiveGame() {
    const [bdsData, setBdsData] = React.useState(undefined)
    const [simonData, setSimonData] = React.useState(undefined)
    const [csData, setCsData] = React.useState(undefined)
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    const participantList = useRef(null)
    const [errorMessage, setErrorMessage] = React.useState(undefined)   
    const handleUpload = (d, game) => {
        switch(game) {
            case "bds":
                setBdsData(d)
                break
            case "simon":
                setSimonData(d)
                break
            case "cs":
                setCsData(d)
                break
            default:
                throw new Error("Unknown game: " + game);
        }
    }
    useEffect(() => {
        if(bdsData !== undefined) {
            const subjects = bdsData['Subject']
            if(subjects === undefined) {
                setErrorMessage("No 'subject_id' column found in data, please make sure you have a fortune deck dataset.")
            } else {
                let participants = new dfd.Series(bdsData['Subject'].values).unique()
                participantList.current = new ParticipantList(participants, bdsData)
                setErrorMessage(undefined)
            }
            forceUpdate()
        }
    }, [bdsData])
    return (
        <div className='games'>
            <h1>Enter data NOT IMPLEMENTED YET</h1>
            <CSVReader parentCallback={handleUpload} gameId="bds" key="bds"/>
            <CSVReader parentCallback={handleUpload} gameId="simon" key="simon"/>
            <CSVReader parentCallback={handleUpload} gameId="cs" key="cs"/>
            {errorMessage && <h2>{errorMessage}</h2>}
            {!errorMessage && <GamesFullReport participantList={participantList.current}/>}
        </div>
    )
}
