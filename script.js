document.getElementById('runBtn').addEventListener('click', () => {
    try {
        // 画面の入力値を取得
        const mu = parseFloat(document.getElementById('muInput').value);
        const sigma = parseFloat(document.getElementById('sigmaInput').value);
        const initialV = parseFloat(document.getElementById('v0Input').value);
        const maxYears = parseInt(document.getElementById('maxYearsInput').value);

        const numTrials = 3000; 
        const taxRate = 0.20315;
        const cVirt = 100.0; // 仮想アンカーバッファ（万円）

        // 対数正規分布のパラメータ計算
        const sigmaLog = Math.sqrt(Math.log(1 + Math.pow(sigma / (1 + mu), 2)));
        const muLog = Math.log(1 + mu) - (sigmaLog * sigmaLog) / 2.0;

        let yearsNeeded = [];
        let totalAddedCapitals = [];
        let achievedCount = 0;

        for (let i = 0; i < numTrials; i++) {
            let vT = initialV;       // TQQQ評価額（万円）
            let bT = initialV;       // 取得原価
            let cReal = 0.0;         // 実キャッシュ
            let iTotal = 0.0;        // 累計追加資金
            let achieved = false;

            for (let t = 1; t <= maxYears; t++) {
                // 1. 価格変動（対数正規乱数）
                let u1 = Math.max(1e-7, Math.random());
                let u2 = Math.random();
                let z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
                let rT = Math.exp(muLog + sigmaLog * z) - 1;
                
                let vPrime = vT * (1 + rT);
                if (vPrime < 0) vPrime = 0;

                // 2. リバランス目標額
                let aT = vPrime + cReal + cVirt;
                let tTarget = aT / 2.0;
                let delta = vPrime - tTarget;

                // 3. リバランス実行
                if (delta > 0) { // 売却
                    let k = delta / vPrime;
                    let bSold = bT * k;
                    let gain = delta - bSold;
                    let tax = Math.max(0.0, gain * taxRate);
                    let sNet = delta - tax;

                    cReal += sNet;
                    bT -= bSold;
                    vT = tTarget;
                } else { // 買増
                    let p = Math.abs(delta);
                    let u = Math.min(cReal, p);
                    let add = p - u;

                    cReal -= u;
                    iTotal += add;
                    bT += p;
                    vT = tTarget;
                }

                // 4. 終了・達成判定
                if (cReal >= vT) {
                    yearsNeeded.push(t);
                    totalAddedCapitals.push(iTotal);
                    achieved = true;
                    achievedCount++;
                    break;
                }
            }

            if (!achieved) {
                yearsNeeded.push(maxYears);
                totalAddedCapitals.push(iTotal);
            }
        }

        // 統計処理用ヘルパー
        function getPercentile(arr, p) {
            let sorted = [...arr].sort((a, b) => a - b);
            let index = Math.floor((p / 100) * sorted.length);
            return sorted[Math.min(index, sorted.length - 1)];
        }

        function getAverage(arr) {
            let sum = arr.reduce((a, b) => a + b, 0);
            return sum / arr.length;
        }

        // 各種KPIの集計
        const achievementRate = (achievedCount / numTrials) * 100;
        
        const medYears = getPercentile(yearsNeeded, 50);
        const avgYears = getAverage(yearsNeeded);
        const p5Years = getPercentile(yearsNeeded, 5);
        const p95Years = getPercentile(yearsNeeded, 95);

        const medCapital = getPercentile(totalAddedCapitals, 50);

        // 画面への反映
        document.getElementById('achievementRate').textContent = `${achievementRate.toFixed(1)}% (${achievedCount} / ${numTrials}回)`;
        document.getElementById('medYears').textContent = `${medYears} 年`;
        document.getElementById('avgYears').textContent = `${avgYears.toFixed(1)} 年`;
        document.getElementById('p5Years').textContent = `${p5Years} 年`;
        document.getElementById('p95Years').textContent = `${p95Years} 年`;
        document.getElementById('medCapital').textContent = `${medCapital.toFixed(1)} 万円`;

        document.getElementById('resultsArea').style.display = 'block';

    } catch (error) {
        console.error("エラー:", error);
        alert("計算中にエラーが発生しました。");
    }
});