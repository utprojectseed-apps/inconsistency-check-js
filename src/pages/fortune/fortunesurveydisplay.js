import FortuneSurvey from "../../survey/fortunesurvey";
import CSVReader from "../../components/csvread";
import React, { useEffect, useReducer } from "react";

export default function FortuneSurveyDisplay() {
    const [data, setData] = React.useState(undefined)
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    const [errorMessage, setErrorMessage] = React.useState(undefined)   
    const handleUpload = d => {
        setData(d)
    }
    useEffect(() => {
        async function startSurveyRead() {
            await survey.readFortuneCSV()
            if(data !== undefined) {
                survey.setData(data)
            }
        }
        startSurveyRead()
        if(data !== undefined) {
            forceUpdate()
        }
    }, [data])

    const survey = new FortuneSurvey([]);
    survey.readFortuneCSV()
    return (
        <div className='survey'>
            <h1>TODO Survey code</h1>
            <div className='no-print'><CSVReader parentCallback={handleUpload} gameId = "fortune"/></div>
        </div>
    )
}