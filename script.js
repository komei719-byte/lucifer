document.getElementById('runBtn').addEventListener('click', () => {
    const numTrials = 1000; 
    const maxYears = 30;
    const taxRate = 0.20315;
    const cVirt = 100.0;          // 仮想アンカー基準値ベース
    const B_max = 300.0;          // 通算追加手出し上限（万円）※必要に応じて調整可能

    const mu = 0.537;
    const sigma = 0.704;

    const sigmaLog = Math.sqrt(Math.log(1 + Math.pow(sigma / (1 + mu), 2)));
    const muLog = Math.log(1 + mu) - (sigmaLog * sigmaLog) / 2.0;

    let failureCount = 0;
    let totalAddedCapitals = [];
    let finalAssets = [];

    for (let i = 0; i < numTrials; i++) {
        let vT = 100.0;     // TQQQ評価額（万円）
        let bT = 100.0;     // 取得原価
        let cReal = 0.0;    // 実キャッシュ
        let iTotal = 0.0;   // 累計追加資金
        let isFailed = false;

        for (let t = 1; t <= maxYears; t++) {
            // 1. 価格変動
            let u1 = Math.max(1e-7, Math.random());
            let u2 = Math.random();
            let z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
            
            let rT = Math.exp(muLog + sigmaLog * z) - 1;
            let vPrime = vT * (1 + rT);
            
            // 対ゼロ・マイナスガード
            if (vPrime < 0) vPrime = 0;

            // 2. リバランス目標額（実資産ベースの半々）
            let realTotal = vPrime + cReal;
            let targetTQQQ = realTotal / 2.0;
            let delta = vPrime - targetTQQQ;

            // 3. リバランス実行
            if (delta > 0) { // 売却（利益確定・キャッシュ化）
                let k = delta / vPrime;
                let bSold = bT * k;
                let gain = delta - bSold;
                let tax = Math.max(0.0, gain * taxRate);
                let sNet = delta - tax;

                cReal += sNet;
                bT -= bSold;
                vT = targetTQQQ;
            } else { // 買増（下落時の買い支え）
                let p = Math.abs(delta); // 不足分
                let u = Math.min(cReal, p); // 実キャッシュから取り崩す分
                let add = p - u;           // 実キャッシュが足りず、外部から手出しする分

                cReal -= u;
                iTotal += add;

                // 追加手出し上限（B_max）のチェック
                if (iTotal > B_max) {
                    isFailed = true;
                    break;
                }

                bT += p;
                vT = targetTQQQ;
            }

            // 完全ロスト判定
            if (vT + cReal <= 0) {
                isFailed = true;
                break;
            }
        }

        if (isFailed) {
            failureCount++;
            totalAddedCapitals.push(B_max); // 破綻時は上限まで手出ししたとみなす
            finalAssets.push(0);
        } else {
            totalAddedCapitals.push(iTotal);
            finalAssets.push(vT + cReal);
        }
    }

    function getPercentile(arr, p) {
        let sorted = [...arr].sort((a, b) => a - b);
        let index = Math.floor((p / 100) * sorted.length);
        return sorted[Math.min(index, sorted.length - 1)];
    }

    const failRate = (failureCount / numTrials) * 100;
    const medCapital = getPercentile(totalAddedCapitals, 50);
    const p99Capital = getPercentile(totalAddedCapitals, 99);
    const p50Asset = getPercentile(finalAssets, 50);
    const p10Asset = getPercentile(finalAssets, 10);

    // 画面への反映
    document.getElementById('failRate').textContent = `${failRate.toFixed(2)}% (生存率: ${(100 - failRate).toFixed(2)}%)`;
    document.getElementById('injectionDist').textContent = `中央値: ${medCapital.toFixed(1)} 万円 / 99タイル(ワースト): ${p99Capital.toFixed(1)} 万円`;
    document.getElementById('p50Asset').textContent = `${Math.round(p50Asset).toLocaleString()} 万円`;
    document.getElementById('p10Asset').textContent = `${Math.round(p10Asset).toLocaleString()} 万円`;

    document.getElementById('resultsArea').style.display = 'block';
});