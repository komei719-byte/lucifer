document.getElementById('runBtn').addEventListener('click', () => {
    const numTrials = 1000; 
    const maxYears = 30;
    const taxRate = 0.20315;
    const cVirt = 100.0; // 単位：万円（仮想アンカーバッファ）

    const mu = 0.537;
    const sigma = 0.704;

    const sigmaLog = Math.sqrt(Math.log(1 + Math.pow(sigma / (1 + mu), 2)));
    const muLog = Math.log(1 + mu) - (sigmaLog * sigmaLog) / 2.0;

    let yearsNeeded = [];
    let totalAddedCapital = [];
    let achievedCount = 0;

    for (let i = 0; i < numTrials; i++) {
        let vT = 100.0;     // TQQQ評価額（万円）
        let bT = 100.0;     // 取得原価
        let cReal = 0.0;    // 実キャッシュ
        let iTotal = 0.0;   // 累計追加資金

        let achieved = false;
        let finalT = maxYears;

        for (let t = 1; t <= maxYears; t++) {
            // 1. 価格変動
            let u1 = Math.max(1e-7, Math.random());
            let u2 = Math.random();
            let z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
            
            let rT = Math.exp(muLog + sigmaLog * z) - 1;
            let vPrime = vT * (1 + rT);
            
            if (vPrime < 0) vPrime = 0;

            // 2. リバランス目標額の調整（実資産ベースの半々 ＋ 仮想アンカー考慮）
            // 仮想アンカーを含めた全体バッファから、狙うべきTQQQのターゲットを算出
            let aT = vPrime + cReal + cVirt;
            let tTarget = (vPrime + cReal + cVirt) / 2.0;
            
            // もし実キャッシュ比率が十分に高くなれるよう、ターゲットを実資産の半々に補正
            let realTotal = vPrime + cReal;
            let targetTQQQ = realTotal / 2.0;
            let delta = vPrime - targetTQQQ;

            // 3. リバランス実行
            if (delta > 0) { // 売却
                let k = delta / vPrime;
                let bSold = bT * k;
                let gain = delta - bSold;
                let tax = Math.max(0.0, gain * taxRate);
                let sNet = delta - tax;

                cReal += sNet;
                bT -= bSold;
                vT = targetTQQQ;
            } else { // 買増
                let p = Math.abs(delta);
                let u = Math.min(cReal, p);
                let add = p - u;

                cReal -= u;
                iTotal += add;
                bT += p;
                vT = targetTQQQ;
            }

            // 4. 終了判定（実資産におけるキャッシュ比率が49%を超えたか）
            let totalRealAsset = vT + cReal;
            let cashRatio = totalRealAsset > 0 ? (cReal / totalRealAsset) : 0;

            if (cashRatio >= 0.49) {
                yearsNeeded.push(t);
                totalAddedCapital.push(iTotal);
                achieved = true;
                achievedCount++;
                finalT = t;
                break;
            }
        }

        if (!achieved) {
            yearsNeeded.push(maxYears);
            totalAddedCapital.push(iTotal);
        }
    }

    function getPercentile(arr, p) {
        let sorted = [...arr].sort((a, b) => a - b);
        let index = Math.floor((p / 100) * sorted.length);
        return sorted[Math.min(index, sorted.length - 1)];
    }

    function getAverage(arr) {
        let sum = arr.reduce((a, b) => a + b, 0);
        return sum / arr.length;
    }

    const medYears = getPercentile(yearsNeeded, 50);
    const avgYears = getAverage(yearsNeeded);
    const p5Years = getPercentile(yearsNeeded, 5);
    const p95Years = getPercentile(yearsNeeded, 95);

    const medCapital = getPercentile(totalAddedCapital, 50);
    const p95Capital = getPercentile(totalAddedCapital, 95);
    const achievementRate = (achievedCount / numTrials) * 100;

    // 画面への反映
    document.getElementById('failRate').textContent = `${achievementRate.toFixed(1)}% (達成率) / 未達成率: ${(100 - achievementRate).toFixed(1)}%`;
    document.getElementById('injectionDist').textContent = `中央値: ${medCapital.toFixed(1)} 万円 / 95タイル(ワースト): ${p95Capital.toFixed(1)} 万円`;
    document.getElementById('p50Asset').textContent = `中央値: ${medYears} 年 (平均: ${avgYears.toFixed(1)}年)`;
    document.getElementById('p10Asset').textContent = `最速(5%): ${p5Years} 年 / 遅め(95%): ${p95Years} 年`;

    document.getElementById('resultsArea').style.display = 'block';
});