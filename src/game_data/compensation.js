// compensation.js
export const BASE_COMP = 2;
export const BONUS_AMOUNTS = [1, 2, 3, 0, 2, 3, 0, 1, 0, 1, 0, 2, 3, 4];
export const BONUS_TYPES = ['SINGLE', 'DOUBLE', 'SUPER', '', 'DOUBLE', 'SUPER', '', 'SINGLE', '', 'SINGLE', '', 'DOUBLE', 'SUPER', 'TRIPLE'];

export function estCompensation(avgCompletionRates, bds) {
    const compRates = Array(14).fill("$ 0.00");
    const cumulativeComp = Array(14).fill(0);
    const potentialCumComp = Array(14).fill(0);

    //console.log("we are in est")
    for (let i = 0; i < 14; ++i) {
        //console.log("inside loop")
        if (avgCompletionRates[i] > 0.5) { // .5
            //console.log("HERE")
            compRates[i] = `$ ${(BASE_COMP + BONUS_AMOUNTS[i]).toFixed(2)}`;
            cumulativeComp[i] = BASE_COMP + BONUS_AMOUNTS[i];
        } else if (avgCompletionRates[i] > 0) {
            compRates[i] = `$ ${(BASE_COMP).toFixed(2)}`;
            cumulativeComp[i] = BASE_COMP;
        }
    }

    for (let i = 1; i < 14; ++i) {
        cumulativeComp[i] += cumulativeComp[i - 1];
    }

    for (let i = 0; i < 14; ++i) {
        if (i < bds.game.cyclePassed(i)) {
            potentialCumComp[i] = cumulativeComp[i];
        } else {
            potentialCumComp[i] = (i === 0 ? 0 : potentialCumComp[i - 1]) + BASE_COMP + BONUS_AMOUNTS[i];
        }
    }
    return [compRates, cumulativeComp, potentialCumComp, BONUS_TYPES];
}
