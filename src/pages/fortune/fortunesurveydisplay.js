import FortuneSurvey from "../../survey/fortunesurvey";

export default function FortuneSurveyDisplay() {
    const survey = new FortuneSurvey([]);
    survey.readFortuneCSV()
    return (
        <div className='survey'>
            <h1>TODO Survey code</h1>
        </div>
    )
}