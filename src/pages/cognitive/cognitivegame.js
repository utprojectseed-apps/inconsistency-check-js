import CSVReader from "../../components/csvread";
import React, { useEffect, useRef, useReducer } from "react";
import * as dfd from 'danfojs';
import ParticipantList from "../../game_data/participants";
import CheckboxesTags from "../../components/checkboxestags";
// import GamesFullReport from "../../components/gamesfullreport";

export default function CognitiveGame() {
    const [bdsData, setBdsData] = React.useState(undefined)
    const [simonData, setSimonData] = React.useState(undefined)
    const [csData, setCsData] = React.useState(undefined)
    const [, forceUpdate] = useReducer(x => x + 1, 0);
    const bdsList = useRef(null)
    const simonList = useRef(null)
    const csList = useRef(null)
    const [errorMessage, setErrorMessage] = React.useState(undefined)   
    const [selectedIds, setSelectedIds] = React.useState([])
    const [allParticipantsIds, setAllParticipantsIds] = React.useState(undefined)
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
    useEffect(() => {
        if(bdsData !== undefined) {
            const subjects = bdsData['Subject']
            if(subjects === undefined) {
                setErrorMessage("No 'Subject' column found in data, please make sure you have a bds dataset.")
            } else {
                let participants = new dfd.Series(bdsData['Subject'].values).unique()
                // jank for rn
                // eventually should probably be one list but current class infrastructure doesn't support that due to poor planning :(
                bdsList.current = bdsData !== undefined ? new ParticipantList(participants, bdsData) : null
                simonList.current = simonData !== undefined ? new ParticipantList(participants, simonData) : null
                csList.current = csData !== undefined ? new ParticipantList(participants, csData) : null
                let allList = []
                allList.push(...[bdsList.current, simonList.current, csList.current].filter(list => list !== null && list !== undefined))
                let participantIds = new Set(...allList.map(participantList => participantList.participants.map(participant => participant.id)))
                setAllParticipantsIds([...participantIds])
                setErrorMessage(undefined)
            }
            forceUpdate()
        }
    }, [bdsData, simonData, csData])
    return (
        <div>
            <div className="no-print">
                <h1>Cognitive Games (BDS, Simon, and Color-Shape) Enter Data:</h1>
                <CSVReader parentCallback={handleUpload} gameId="bds" key="bds"/>
                <CSVReader parentCallback={handleUpload} gameId="simon" key="simon"/>
                <CSVReader parentCallback={handleUpload} gameId="cs" key="cs"/>
                <div className='no-print' style={{display: 'flex'}}>
                    <CheckboxesTags ids={allParticipantsIds || []} parentCallback={handleSelected}/>
                </div>
            </div>
            {errorMessage && <h2>{errorMessage}</h2>}
            <div id="cognitiveGames">
                {!errorMessage && <CognitiveGamesReport bdsList={bdsList.current} simonList={simonList.current} csList={csList.current} activeIds={selectedIds}/>}
            </div>
        </div>
    )
}

// all of this is temp and jank but the layout we want for the report
/**
 * Renders a report of cognitive games for a list of participants.
 *
 * @param {Object} props - The properties object.
 * @param {Object} props.bdsList - The BDS list of participants.
 * @param {Object} props.simonList - The Simon list of participants.
 * @param {Object} props.csList - The Color-Shape list of participants.
 * @param {Array} props.activeIds - The list of active participant IDs.
 * @return {JSX.Element[]} The rendered report of cognitive games.
 */
function CognitiveGamesReport(props) {
    let bdsList = props.bdsList
    let simonList = props.simonList
    let csList = props.csList
    let allList = []
    allList.push(...[bdsList, simonList, csList].filter(list => list !== null && list !== undefined))

    let participantIds = new Set(...allList.map(participantList => participantList.participants.map(participant => participant.id)))
    const filteredParticipants = Array.from(participantIds).filter(participant => {
        return props.activeIds.includes(participant)})

    const participants = filteredParticipants.map(
        participant => <ParticipantReport key={participant} 
        participant={participant} 
        bds={bdsList && bdsList.getParticipant(participant)} 
        simon={simonList && simonList.getParticipant(participant)} 
        cs={csList && csList.getParticipant(participant)}/>)
    return (
        participants
    )
}

/**
 * Renders a component that displays highlights for a participant in a cognitive game.
 *
 * @param {Object} props - The properties passed to the component.
 * @param {Object} props.bds - The BDS object associated with the participant.
 * @param {Object} props.simon - The Simon object associated with the participant.
 * @param {Object} props.cs - The CS object associated with the participant.
 * @param {string} props.participant - The ID of the participant.
 * @return {JSX.Element} The rendered component.
 */
function ParticipantReport(props) {
    const days = props.bds.game.getCompletedDays().map(
        (day, i) => {
            return <CognitiveGameDayInfo key={i} day={i + 1} bds={props.bds} simon={props.simon} cs={props.cs}/>
        }
    )
    return (
        <div className="gameparticipantreport">
            <ParticipantHeader2 participant={props.participant} bds={props.bds}/>
                {days} 
        </div>
    )
}

/**
 * Renders the participant header with the participant ID, games played, and cycle start date.
 *
 * @param {Object} props - The properties object.
 * @param {string} props.participant - The participant ID.
 * @param {Object} props.bds - The BDS object.
 * @return {JSX.Element} The participant header JSX element.
 */
function ParticipantHeader2({participant, bds}) {
    return (
        <div className="participant-header">
            <h1 className="participant-id">Participant ID: {participant}</h1>
            <h2>Games: BDS, Simon, and Color-Shape</h2>
            <h3>Cycle start date: {bds.game.getCycleStartDate()}</h3>
        </div>) 
}

/**
 * Renders the information for a specific day in the Cognitive Game.
 *
 * @param {Object} props - The properties object.
 * @param {number} props.day - The day number.
 * @param {Object} props.bds - The BDS object.
 * @param {Object} props.simon - The Simon object.
 * @param {Object} props.cs - The Color-Shape object.
 * @return {JSX.Element} The JSX element representing the day information.
 */
function CognitiveGameDayInfo({day, bds, simon, cs}) {
    const bdsSessions = bds.game.getNumberSessionsDays()[day - 1]
    const bdsCompletion = bds.game.getCompletedDays()[day - 1]
    const bdsSessionAccuracy = bds.game.getMeanSessionsAccuracys()[day - 1]
    const bdsPracticeTrials = bds.game.getPracticeTrialsAmountDays()[day - 1]
    const bdsPracticeAccuracy = bds.game.getPracticeTrialsAccuracyDays()[day - 1]
    const maxCorrectDigitSpan = bds.game.getMaxCorrectDigitSpanDays()[day - 1]
    const maxDigitSpan = bds.game.getMaxDigitSpanDays()[day - 1]
    const meanDigitSpan = bds.game.getMeanSpans()[day - 1]
    const twoErrorMaxLength = bds.game.getTwoErrorMaxLengths()[day - 1]
    const twoErroTotalTrials = bds.game.getTwoErrorTotalTrials()[day - 1]
    const bdsLang = bds.game.getLanguagePlayedForSessions()[day - 1]
    const bdsPlayTime = bds.game.getGameTimes()[day - 1]

    const simonSessions = simon.game.getNumberSessionsDays()[day - 1]
    const simonCompletion = simon.game.getCompletedDays()[day - 1]
    const simonSessionAccuracy = simon.game.getMeanSessionsAccuracys()[day - 1]
    const simonPracticeTrials = simon.game.getPracticeTrialsAmountDays()[day - 1]
    const simonPracticeAccuracy = simon.game.getPracticeTrialsAccuracyDays()[day - 1]
    const simonNoInput = simon.game.getNoInputTrialsDays()[day - 1]
    const simonLang = simon.game.getLanguagePlayedForSessions()[day - 1]
    const simonPlayTime = simon.game.getGameTimes()[day - 1]

    const csSessions = cs.game.getNumberSessionsDays()[day - 1]
    const csCompletion = cs.game.getCompletedDays()[day - 1]
    const csSessionAccuracy = cs.game.getMeanSessionsAccuracys()[day - 1]
    const csPracticeTrials = cs.game.getPracticeTrialsAmountDays()[day - 1]
    const csPracticeAccuracy = cs.game.getPracticeTrialsAccuracyDays()[day - 1]
    const csNoInput = cs.game.getNoInputTrialsDays()[day - 1]
    const csLang = cs.game.getLanguagePlayedForSessions()[day - 1]
    const csPlayTime = cs.game.getGameTimes()[day - 1]

    const header_color = (bdsCompletion, simonCompletion, csCompletion) => {
        if (bdsCompletion >= 100 && simonCompletion >= 100 && csCompletion >= 100) {
            return "lightgreen";
        }
        if (bdsCompletion <= 0 && simonCompletion <= 0 && csCompletion <= 0) {
            return "lightcoral";
        }
        return "plum";
    }
    return (
        <div className='dayinformation'>
            <div className='day-bar' style={{width: `${bdsCompletion}%`}}></div>
                <div className={`day-header ${header_color}`} style={{backgroundColor: `${header_color(bdsCompletion, simonCompletion, csCompletion)}`}}>
                    <h2>Day {day} - W{Math.floor((day - 1) / 7) + 1}</h2>
                </div>
            <h4>BDS Task</h4>
                <div className="test-day-details">
                    <p data-label="Sessions started:">{bdsSessions}</p>
                    <p data-label="Session completion:">{bdsCompletion} %</p>
                    <p data-label="Mean Session accuracy:">{bdsSessionAccuracy} %</p>
                    <p data-label="Practice trials accuracy:">{bdsPracticeAccuracy} %</p>
                    <p data-label="Practice trials amount:">{bdsPracticeTrials}</p>
                    <p data-label="Max Digit Span:">{maxDigitSpan}</p>
                    <p data-label="Mean Span (MS):">{meanDigitSpan}</p>
                    <p data-label="Max Correct Digit Span (ML):">{maxCorrectDigitSpan}</p>
                    <p data-label="Two-Error Maximum Length (TE-ML):">{twoErrorMaxLength}</p>
                    <p data-label="Two-Error Total Trials (TE-TT):">{twoErroTotalTrials}</p>
                    <p data-label="Language:">{bdsLang}</p>
                    <p data-label="Game Time:">{bdsPlayTime}</p>
                </div>
            <h4>Simon Task</h4>
                <div className="test-day-details">
                    <p data-label="Sessions started:">{simonSessions}</p>
                    <p data-label="Session completion:">{simonCompletion} %</p>
                    <p data-label="Mean Session accuracy:">{simonSessionAccuracy} %</p>
                    <p data-label="Practice trials accuracy:">{simonPracticeAccuracy} %</p>
                    <p data-label="Practice trials amount:">{simonPracticeTrials}</p>
                    <p data-label="No Input Trials:">{simonNoInput}</p>
                    <p data-label="Language:">{simonLang}</p>
                    <p data-label="Game Time:">{simonPlayTime}</p>
                </div>
            <h4>Color-Shape Task</h4>
                <div className="test-day-details">
                    <p data-label="Sessions started:">{csSessions}</p>
                    <p data-label="Session completion:">{csCompletion} %</p>
                    <p data-label="Mean Session accuracy:">{csSessionAccuracy} %</p>
                    <p data-label="Practice trials accuracy:">{csPracticeAccuracy} %</p>
                    <p data-label="Practice trials amount:">{csPracticeTrials}</p>
                    <p data-label="No Input Trials:">{csNoInput}</p>
                    <p data-label="Language:">{csLang}</p>
                    <p data-label="Game Time:">{csPlayTime}</p>
                </div>
        </div>
    )
}