// Helper Functions

export const getFeatureData = async (featureUrl) => {
    try {
        const data = await fetch(featureUrl)
        return await data.json()
    } catch (error) {
        throw new Error(`Failed to get features from ${featureUrl}: ${error.message}`);
    }
}

export const calculatePoints = (featuresToCalc, selectedFeatures, playerRole) => {
    const pointsReturn = featuresToCalc.reduce((total, feature) => {
        // Todo: to be review
        const isSelected = selectedFeatures[feature?.name];
        const roleBonus = feature.bonus[playerRole] || 0;
        return (total + (isSelected ? roleBonus : 0));
    }, 0);

    return (Number(pointsReturn.toFixed(1)));
}

// Helper Function: Update player points and history
export const updatePlayerPoints = (players, playerBonusesByRole, roundIndex, roundPointsHistory) => {
    return players.map((player) => {
        const role = player.get("role");
        const roleName = player.get("name");
        const totalPoints = playerBonusesByRole[role] || 0;
        const cumulativePoints = player.get("cumulativePoints") || 0;

        player.set("roundPoints", totalPoints);
        player.set("cumulativePoints", totalPoints + cumulativePoints);
        player.set("RoundPointsHistory", roundPointsHistory);

        return { roundIndex, totalPoints, roleName, role };
    });
};
