import CognitiveSurvey from "../../survey/cognitivesurvey";
import CSVReader from "../../components/csvread";
import React, { useEffect, useReducer, useRef } from "react";
import CheckboxesTags from "../../components/checkboxestags";
import SurveyFullReport from "../../components/surveyfullreport";

export default function CognitiveSurveyDisplay() {
    const [data, setData] = React.useState(undefined)
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    const [errorMessage, setErrorMessage] = React.useState(undefined)   
    const [ids, setIds] = React.useState(undefined)
    const [selectedIds, setSelectedIds] = React.useState(undefined)
    const [loading, setLoading] = React.useState(false)
    const survey = useRef(new CognitiveSurvey())
    const handleUpload = d => {
        setData(d)
    }
    const handleSelected = d => {
        setSelectedIds(d)
        //TODO: should probably let them select, and then press a button to load the reports
        survey.current.setSelectedIds(d)
    }
    useEffect(() => {
        async function startSurveyRead() {
            setLoading(true)
            await survey.current.readFortuneCSV()
            if(data !== undefined) {
                survey.current.setData(data)
                setIds(survey.current.getParticipantIds())
            }
            setLoading(false)
        }
        startSurveyRead()
        if(data !== undefined) {
            forceUpdate()
        }
    }, [data])

    survey.current.readFortuneCSV()
    return (
        <div className='survey'>
            <div className='no-print'>
                <h1 className='no-print'>Enter data</h1>
                <CSVReader parentCallback={handleUpload} gameId = "cognitive"/>
            </div>
            
            <div className='no-print'>
                <CheckboxesTags className="no-print" ids={ids} parentCallback={handleSelected}/>
            </div>

            {!loading &&!errorMessage && <SurveyFullReport participantList={survey.current} activeIds={selectedIds}/>}
            
        </div>
    )
}