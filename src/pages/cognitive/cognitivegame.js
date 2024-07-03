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
        if(csData != undefined) {
            const csSubjects = csData['Subject']
            if(csSubjects === undefined) {
                setErrorMessage("No 'Subject' column found in data, please make sure you have a color-shape task dataset.")
            } else {
                let csParticipants = new dfd.Series(csSubjects.values).unique()
                console.log("HERE CS")
                participantList.current = new ParticipantList(csParticipants, csData)
                setErrorMessage(undefined)
            }
            forceUpdate()
        }
        console.log("SIKE WTF")
    }, [csData])
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
// useEffect(() => {
//         if(bdsData !== undefined && simonData !== undefined) {
//             const bdsSubjects = bdsData['Subject']
//             const simonSubjects = simonData['Subject']
//             if(bdsSubjects === undefined && simonSubjects === undefined) {
//                 setErrorMessage("No 'subject_id' column found in data, please make sure you have a fortune deck dataset.")
//             } else {
//                 let bdsParticipants = new dfd.Series(bdsSubjects.values).unique()
//                 let simonParticipants = new dfd.Series(simonSubjects.values).unique()
//                 participantList.current = new ParticipantList(simonParticipants, simonData)//new ParticipantList(bdsParticipants, bdsData)
//                 setErrorMessage(undefined)
//             }
//             forceUpdate()
//         }
//     }, [bdsData, simonData])
    return (
        <div className='games'>
            <h1>Enter data NOT IMPLEMENTED YET Order:(BDS, SIMON, CS)</h1>
            <CSVReader parentCallback={handleUpload} gameId="bds" key="bds"/>
            <CSVReader parentCallback={handleUpload} gameId="simon" key="simon"/>
            <CSVReader parentCallback={handleUpload} gameId="cs" key="cs"/>
            {errorMessage && <h2>{errorMessage}</h2>}
            {!errorMessage && <GamesFullReport participantList={participantList.current}/>}
        </div>
    )
}
