document.getElementById('runBtn').addEventListener('click', () => {
    // 入力値の取得
    const V0 = parseFloat(document.getElementById('v0').value);
    const years = parseInt(document.getElementById('years').value);
    const trials = parseInt(document.getElementById('trials').value);
    const B_max = parseFloat(document.getElementById('bMax').value);

    let failureCount = 0;
    let finalAssets = [];
    let totalInjections = [];

    // パラメータ設定（日次換算）
    const tradingDaysPerYear = 252;
    const underlyingDailyMean = 0.08 / tradingDaysPerYear;
    const underlyingDailyVol = 0.25 / Math.sqrt(tradingDaysPerYear);
    const leverage = 3.0;
    const dailyCost = 0.01 / tradingDaysPerYear; // レバレッジ維持コスト

    for (let t = 0; t < trials; t++) {
        let asset = V0;
        let anchor = V0; // 仮想アンカー基準値
        let cumulativeInjection = 0;
        let isFailed = false;

        for (let y = 0; y < years; y++) {
            // 1年を252営業日として日次でシミュレーション
            for (let d = 0; d < tradingDaysPerYear; d++) {
                // Box-Muller法による正規乱数
                let u1 = Math.max(1e-7, Math.random());
                let u2 = Math.random();
                let z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

                let marketReturn = underlyingDailyMean + underlyingDailyVol * z;
                
                // 暴落クラスター（テールリスク）
                if (Math.random() < 0.008) {
                    marketReturn = -0.07; // 1日で7%下落
                }

                // 3倍レバレッジの日常変動
                let tqqqDailyReturn = marketReturn * leverage - dailyCost;

                // --- 【対ゼロ・マイナスガード】 ---
                // レバレッジ商品がどんなに暴落しても、1日の下落率が -100%（因子が 0）を下回って
                // 資産価値がマイナス（負値）や計算エラー（NaN）にならないよう厳格にガードする
                if (tqqqDailyReturn <= -1.0) {
                    tqqqDailyReturn = -0.9999; // 理論上のゼロ収れんガード（完全ロスト手前で踏みとどまる）
                }

                asset = asset * (1 + tqqqDailyReturn);

                // 資産が実質的にゼロとみなせる水準（例: 1円未満）になった場合のフロア処理
                if (asset < 1.0) {
                    asset = 0.0;
                    break;
                }
            }

            if (asset <= 0) {
                isFailed = true;
                break;
            }

            // --- 年次リバランスと仮想アンカー判定 ---
            let targetAnchor = anchor;
            
            if (asset < targetAnchor) {
                let shortage = targetAnchor - asset;

                // 通算上限（B_max）のチェック
                if (cumulativeInjection + shortage > B_max) {
                    isFailed = true;
                    cumulativeInjection = B_max;
                    asset = 0;
                    break;
                } else {
                    cumulativeInjection += shortage;
                    asset = targetAnchor; // 追加手出しでアンカー水準まで回復
                }
            } else {
                anchor = Math.max(anchor, asset);
            }
        }

        if (isFailed) {
            failureCount++;
            finalAssets.push(0);
        } else {
            finalAssets.push(asset);
        }
        totalInjections.push(cumulativeInjection);
    }

    // 統計処理（KPIの算出）
    finalAssets.sort((a, b) => a - b);
    totalInjections.sort((a, b) => a - b);

    const failRate = (failureCount / trials) * 100;
    const p50Asset = finalAssets[Math.floor(trials * 0.50)];
    const p10Asset = finalAssets[Math.floor(trials * 0.10)];
    const injMedian = totalInjections[Math.floor(trials * 0.50)];
    const inj99 = totalInjections[Math.floor(trials * 0.99)];

    // 画面への反映
    document.getElementById('failRate').textContent = failRate.toFixed(2) + '%';
    document.getElementById('injectionDist').textContent = `中央値: ${Math.round(injMedian).toLocaleString()}円 / 99タイル: ${Math.round(inj99).toLocaleString()}円`;
    document.getElementById('p50Asset').textContent = Math.round(p50Asset).toLocaleString() + '円';
    document.getElementById('p10Asset').textContent = Math.round(p10Asset).toLocaleString() + '円';

    document.getElementById('resultsArea').style.display = 'block';
});