document.getElementById('runBtn').addEventListener('click', () => {
    // 入力値の取得
    const V0 = parseFloat(document.getElementById('v0').value);
    const years = parseInt(document.getElementById('years').value);
    const trials = parseInt(document.getElementById('trials').value);
    const B_max = parseFloat(document.getElementById('bMax').value);

    let failureCount = 0;
    let finalAssets = [];
    let totalInjections = [];

    // TQQQを想定した年次リターンモデル（ITバブル崩壊やリーマン等のテールリスクを簡易ブートストラップ風に模す）
    // 平均リターン、ボラティリティ、および暴落クラスターの簡易パラメータ
    const meanReturn = 0.15; // 年利期待値（レバレッジ効果含む）
    const vol = 0.60;        // 高ボラティリティ (60%)

    for (let t = 0; t < trials; t++) {
        let asset = V0;
        let anchor = V0; // 仮想アンカー基準値
        let cumulativeInjection = 0;
        let isFailed = false;

        for (let y = 0; y < years; y++) {
            // 幾何ブラウン運動＋暴落イベントの確率的発生（ITバブル・リーマン等のショックを模す簡易ロジック）
            let shock = 0;
            // 確率的に極端な暴落（例: -60%〜-80%）を発生させる
            if (Math.random() < 0.10) { 
                shock = -0.65; // テールリスク発動
            } else {
                // 通常時の正規分布風ランダムノイズ (Box-Muller法)
                let u1 = Math.max(1e-7, Math.random());
                let u2 = Math.random();
                let z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
                shock = meanReturn + vol * z;
            }

            // 資産の変動（対ゼロ・マイナスガード適用）
            asset = asset * (1 + shock);
            if (asset < 0) asset = 0;

            // 年次リバランスと仮想アンカーの仕組み
            // ターゲット（アンカー）を下回った場合、乖離額を追加手出しで補填する
            if (asset < anchor) {
                let shortage = anchor - asset;
                
                // 通算上限チェック
                if (cumulativeInjection + shortage > B_max) {
                    // バッファを使い果たして破綻
                    isFailed = true;
                    cumulativeInjection = B_max;
                    asset = 0;
                    break;
                } else {
                    cumulativeInjection += shortage;
                    asset = anchor; // アンカーまでバッファで復元
                }
            }

            // 翌年の仮想アンカーを更新（または固定）
            // ここではシンプルに前年のアンカーまたは資産ベースを維持
            anchor = Math.max(anchor, asset);
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