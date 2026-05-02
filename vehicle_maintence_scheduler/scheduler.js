function maximizeImpact(vehicles, budget) {
    const n = vehicles.length;
    const dp = Array(n + 1).fill(0).map(() => Array(budget + 1).fill(0));

    for (let i = 1; i <= n; i++) {
        const current = vehicles[i - 1];
        const time = current.Duration;
        const score = current.Impact;

        for (let w = 0; w <= budget; w++) {
            if (time <= w) {
                dp[i][w] = Math.max(dp[i - 1][w], dp[i - 1][w - time] + score);
            } else {
                dp[i][w] = dp[i - 1][w];
            }
        }
    }

    let remainingBudget = budget;
    let maxVal = dp[n][budget];
    const pickedVehicles = [];

    for (let i = n; i > 0 && maxVal > 0; i--) {
        if (maxVal !== dp[i - 1][remainingBudget]) {
            const v = vehicles[i - 1];
            pickedVehicles.push(v);
            maxVal -= v.Impact;
            remainingBudget -= v.Duration;
        }
    }

    return pickedVehicles;
}

module.exports = { maximizeImpact };