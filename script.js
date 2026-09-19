document.getElementById('runBtn').addEventListener('click', () => {
    try {
        // 3. モンテカルロ・シミュレーションのパラメータ
        const numTrials = 3000; // 試行回数
        const maxYears = 30;    // 運用期間（年）
        const taxRate = 0.20315; // 譲渡益税
        
        // 初期設定
        const initialV = 100.0;  // 初期TQQQ投資額（万円）
        const initialAnchor = 100.0; // 初期仮想アンカー基準値（万円）
        const bankruptcyThreshold = 150.0; // 実質破綻とみなす累計追加手出しの閾値（万円）

        // パラメータ設定（期待リターン・ボラティリティ）
        const mu = 0.537;
        const sigma = 0.704;
        const sigmaLog = Math.sqrt(Math.log(1 + Math.pow(sigma / (1 + mu), 2)));
        const muLog = Math.log(1 + mu) - (sigmaLog * sigmaLog) / 2.0;

        // KPI集計用配列
        let failureCount = 0;
        let totalAddedCapitals = [];
        let finalAssets = [];
        let totalTaxesPaid = [];

        for (let i = 0; i < numTrials; i++) {
            let vT = initialV;       // TQQQ評価額（万円）
            let bT = initialV;       // TQQQ取得原価
            let cReal = 0.0;         // 実キャッシュプール
            let iTotal = 0.0;        // 累計追加手出し額
            let taxTotal = 0.0;      // 累積納税総額
            let anchor = initialAnchor; // 仮想アンカー基準値
            let isFailed = false;

            for (let t = 1; t <= maxYears; t++) {
                // 1. 価格変動（対数正規乱数による年次リターン）
                let u1 = Math.max(1e-7, Math.random());
                let u2 = Math.random();
                let z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
                let rT = Math.exp(muLog + sigmaLog * z) - 1;
                
                let vPrime = vT * (1 + rT);
                if (vPrime < 0) vPrime = 0;

                // 2. 仮想アンカー基準値（At）に基づくコントロール
                let targetTQQQ = anchor / 2.0;
                let delta = vPrime - targetTQQQ;

                if (delta > 0) { 
                    // ケースB：上昇時・超過発生（リバランス売却 ＆ 課税）
                    let sellAmount = delta;
                    let k = sellAmount / vPrime;
                    let bSold = bT * k;
                    let gain = sellAmount - bSold;
                    let tax = Math.max(0.0, gain * taxRate);
                    let sNet = sellAmount - tax;

                    cReal += sNet;
                    taxTotal += tax;
                    bT -= bSold;
                    vT = targetTQQQ;
                } else { 
                    // ケースA：下落時・不足発生（買増し・追加手出し）
                    let needed = Math.abs(delta);
                    let fromCash = Math.min(cReal, needed);
                    let add = needed - fromCash;

                    cReal -= fromCash;
                    iTotal += add;
                    bT += needed;
                    vT = targetTQQQ;
                }

                // アンカー基準値の更新
                anchor = Math.max(anchor, vT + cReal);

                // 3. 終了判定
                if (vT + cReal <= 0 || iTotal > bankruptcyThreshold) {
                    isFailed = true;
                    break;
                }
            }

            if (isFailed) {
                failureCount++;
            }
            totalAddedCapitals.push(iTotal);
            finalAssets.push(vT + cReal);
            totalTaxesPaid.push(taxTotal);
        }

        // 統計処理用ヘルパー
        function getPercentile(arr, p) {
            let sorted = [...arr].sort((a, b) => a - b);
            let index = Math.floor((p / 100) * sorted.length);
            return sorted[Math.min(index, sorted.length - 1)];
        }

        // 各種KPIの集計
        const failRate = (failureCount / numTrials) * 100;
        
        const medCapital = getPercentile(totalAddedCapitals, 50);
        const p90Capital = getPercentile(totalAddedCapitals, 90);
        const p99Capital = getPercentile(totalAddedCapitals, 99);

        const p10Asset = getPercentile(finalAssets, 10);
        const p50Asset = getPercentile(finalAssets, 50);
        const p90Asset = getPercentile(finalAssets, 90);

        const medTax = getPercentile(totalTaxesPaid, 50);

        // 4. 画面への反映
        document.getElementById('failRate').textContent = `${failRate.toFixed(2)}% (破綻閾値: ${bankruptcyThreshold}万円超過)`;
        document.getElementById('injectionDist').textContent = `中央値(P50): ${medCapital.toFixed(1)} 万円 / 90タイル(P90): ${p90Capital.toFixed(1)} 万円 / 99タイル(P99): ${p99Capital.toFixed(1)} 万円`;
        document.getElementById('p50Asset').textContent = `中央値(P50): ${Math.round(p50Asset).toLocaleString()} 万円 (P10: ${Math.round(p10Asset).toLocaleString()}万 / P90: ${Math.round(p90Asset).toLocaleString()}万)`;
        document.getElementById('taxTotal').textContent = `累積納税総額 (中央値): ${medTax.toFixed(1)} 万円`;

        document.getElementById('resultsArea').style.display = 'block';

    } catch (error) {
        console.error("シミュレーション実行中にエラーが発生しました:", error);
        alert("エラーが発生しました。コンソールを確認してください。");
    }
});