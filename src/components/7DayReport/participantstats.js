export default function ParticipantStats({participant}) {
    if (participant.getId() <= 7789) {return null}

    const rawData = participant.game.getScores()
    let maxScore = 0
    let sumScore = 0
    let count = 0

    for (let i = 0; i < rawData.length; ++i) {  
        if (rawData[i] !== undefined) {
            maxScore = Math.max(maxScore, rawData[i])
            sumScore += parseFloat(rawData[i])
            count += 1
        }
    }

    let avgScore = count === 0 ? 0 : (sumScore / count).toFixed(2)

    const rawDeckData = participant.game.getPerferredDeckDay()

    // need to count the number of times each deck appears
    // then find the deck with the most occurences
    let countA = 0
    let countB = 0
    let countC = 0
    let countD = 0
    let maxCount = 0
    let preferredDeck = 'None'

    for (let i = 0; i < rawDeckData.length; ++i) {
        if (rawDeckData[i] !== undefined) {
            if (rawDeckData[i] === 'A') {
                countA += 1
            } else if (rawDeckData[i] === 'B') {
                countB += 1
            } else if (rawDeckData[i] === 'C') {
                countC += 1
            } else if (rawDeckData[i] === 'D') {
                countD += 1
            }
        }
    }

    if (countA >= countB && countA >= countC && countA >= countD) {
        maxCount = countA;
        preferredDeck = 'A';
    }
    if (countB >= countA && countB >= countC && countB >= countD) {
        // Check for tie between 'B' and previous maxCount
        if (countB > maxCount) {
            maxCount = countB;
            preferredDeck = 'B';
        }
    }
    if (countC >= countA && countC >= countB && countC >= countD) {
        // Check for tie between 'C' and previous maxCount
        if (countC > maxCount) {
            maxCount = countC;
            preferredDeck = 'C';
        }
    }
    if (countD >= countA && countD >= countB && countD >= countC) {
        // Check for tie between 'D' and previous maxCount
        if (countD > maxCount) {
            maxCount = countD;
            preferredDeck = 'D';
        }
    }

    // will get the average reaction time
    const rawReactTimeData = participant.game.getAvgReactTimeDays()
    let sumRT = 0
    let countRT = 0
    for (let i = 0; i < rawReactTimeData.length; ++i) {
        if (rawReactTimeData[i] !== undefined) {
            sumRT += parseFloat(rawReactTimeData[i])
            countRT += 1
        }
    }
    let avgRT = countRT === 0 ? 0 : (sumRT / countRT).toFixed(2)

    const blockProportions = participant.game.getBlockProportions()

    let sumA = 0
    let sumB = 0
    let sumC = 0
    let sumD = 0

    for (let i = 0; i < blockProportions.length; i++) {
        for (let j = 0; j < blockProportions[i].length; j++) {

            const total = blockProportions[i][j]["total"];
            if (total > 0) {
                sumA += blockProportions[i][j]["A"] / total;
                sumB += blockProportions[i][j]["B"] / total;
                sumC += blockProportions[i][j]["C"] / total;
                sumD += blockProportions[i][j]["D"] / total;
            }
            
        }
        
    }

    let blockPref = 'None';

    if (sumA >= sumB && sumA >= sumC && sumA >= sumD) {
        blockPref = 'A';
    } else if (sumB >= sumA && sumB >= sumC && sumB >= sumD) {
        blockPref = 'B';
    } else if (sumC >= sumA && sumC >= sumB && sumC >= sumD) {
        blockPref = 'C';
    } else if (sumD >= sumA && sumD >= sumB && sumD >= sumC) {
        blockPref = 'D';
    }


    return (
        <div>
            <h2>{'Participant ID: ' + participant.getId()}</h2>
            <p>{'Your maximum score: ' + maxScore}</p>
            <p>{'Your average score: ' + avgScore}</p>
            <p>{'Your overall preferred deck: ' + preferredDeck}</p>
            <p>{'Your average response time: ' + avgRT +'ms' }</p>
            <p>{'Your average deck preference per block (20 cards): ' + blockPref}</p>
        </div>
    )
}