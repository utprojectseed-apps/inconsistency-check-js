/* eslint-disable */ //TODO: remove once started implementing
import CSVReader from "../../components/csvread";
import React, { useEffect, useRef, useReducer } from "react";
import * as dfd from 'danfojs';
import ParticipantList from "../../game_data/participants";
import GamesFullReport from "../../components/gamesfullreport";
import CheckboxesTags from "../../components/checkboxestags";

export default function CognitiveGame() {
    const [bdsData, setBdsData] = React.useState(undefined)
    const [simonData, setSimonData] = React.useState(undefined)
    const [csData, setCsData] = React.useState(undefined)
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    const participantList = useRef(null)
    const [errorMessage, setErrorMessage] = React.useState(undefined)
    const [selectedIds, setSelectedIds] = React.useState(undefined)
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
    const handleSelected = d => {
        setSelectedIds(d)
    }
    // useEffect(() => {
    //     if(csData != undefined) {
    //         const csSubjects = csData['Subject']
    //         if(csSubjects === undefined) {
    //             setErrorMessage("No 'Subject' column found in data, please make sure you have a color-shape task dataset.")
    //         } else {
    //             let csParticipants = new dfd.Series(csSubjects.values).unique()
    //             console.log("HERE CS")
    //             participantList.current = new ParticipantList(csParticipants, csData)
    //             setErrorMessage(undefined)
    //         }
    //         forceUpdate()
    //     }
    //     console.log("SIKE WTF")
    // }, [csData])
    // useEffect(() => {
    //     if(simonData != undefined) {
    //         const simonSubjects = simonData['Subject']
    //         if(simonSubjects === undefined) {
    //             setErrorMessage("No 'Subject' column found in data, please make sure you have a simon task dataset.")
    //         } else {
    //             let simonParticipants = new dfd.Series(simonSubjects.values).unique()
    //             console.log("HERE WTF")
    //             participantList.current = new ParticipantList(simonParticipants, simonData)
    //             setErrorMessage(undefined)
    //         }
    //         forceUpdate()
    //     }
    //     console.log("SIKE WTF")
    // }, [simonData])
    // useEffect(() => {
    //     console.log("BEFORE BDS")
    //     if(bdsData != undefined) {
    //         const bdsSubjects = bdsData['Subject']
    //         if(bdsSubjects === undefined) {
    //             setErrorMessage("No 'Subject' column found in data, please make sure you have a bds task dataset.")
    //         } else {
    //             let bdsParticipants = new dfd.Series(bdsSubjects.values).unique()
    //             participantList.current = new ParticipantList(bdsParticipants, bdsData)
    //             setErrorMessage(undefined)
    //         }
    //         forceUpdate()
    //     }
    // }, [bdsData])
     // TODO: need to fix this stuff to read in simon and bds 
    // need to useEffect to set the bdsData and simonData
useEffect(() => {
        if(bdsData !== undefined && simonData !== undefined) {
            const bdsSubjects = bdsData['Subject']
            const simonSubjects = simonData['Subject']
            if(bdsSubjects === undefined && simonSubjects === undefined) {
                setErrorMessage("No 'subject_id' column found in data, please make sure you have a fortune deck dataset.")
            } else {
                let bdsParticipants = new dfd.Series(bdsSubjects.values).unique()
                participantList.current = new ParticipantList(bdsParticipants, bdsData)
                // let simonParticipants = new dfd.Series(simonSubjects.values).unique()
                // participantList.current = new ParticipantList(simonParticipants, simonData)//new ParticipantList(bdsParticipants, bdsData)
                setErrorMessage(undefined)
            }
            forceUpdate()
        }
    }, [bdsData, simonData])
    return (
        <div className='games'>
            <h1 className='no-print'>Enter data NOT IMPLEMENTED FULLY YET Order:(BDS, SIMON, CS)</h1>
            <div className='no-print'><CSVReader parentCallback={handleUpload} gameId="bds"/></div>
            <div className='no-print'><CSVReader parentCallback={handleUpload} gameId="simon"/></div>
            <div className='no-print'><CSVReader parentCallback={handleUpload} gameId="cs"/></div>
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
