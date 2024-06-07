import CSVReader from "./csvread";
import React, { useEffect } from "react";
import * as dfd from 'danfojs';
import ParticipantList from "../../game_data/participants";

export default function IowaGames() {
    const [data, setData] = React.useState(undefined)
    const [participants, setParticipants] = React.useState([])
    const handleUpload = d => {
        setData(d)
    }
    useEffect(() => {
        if(data !== undefined) {
            let participants = new dfd.Series(data['subject_id'].values).unique()
            var participantList = new ParticipantList(participants, data)
            setParticipants(participantList.getIds());
        }
    }, [data])
    return (
        <div className='games'>
            <h1>TODO Games Code</h1>
            <CSVReader parentCallback={handleUpload}/>
            <p>{participants}</p>
        </div>
    )
}