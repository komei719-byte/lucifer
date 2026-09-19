<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>ルシファーの悪魔 戦略シミュレーター</title>
    <style>
        body { font-family: sans-serif; max-width: 900px; margin: 30px auto; padding: 0 20px; line-height: 1.6; color: #333; }
        .controls { background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
        .control-group { display: flex; flex-direction: column; }
        label { font-size: 14px; font-weight: bold; margin-bottom: 5px; }
        input { padding: 8px; font-size: 14px; }
        button { grid-column: span 2; padding: 12px; font-size: 16px; font-weight: bold; background: #2ea44f; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #2c974b; }
        .results { background: #f1f8ff; padding: 20px; border-radius: 8px; }
        .metric { margin-bottom: 14px; font-size: 15px; border-bottom: 1px solid #d1e7dd; padding-bottom: 8px; }
        .metric span { font-weight: bold; color: #0366d6; }
    </style>
</head>
<body>

    <h1>ルシファーの悪魔 戦略シミュレーター</h1>
    <p>パラメータを設定してシミュレーションを実行してください</p>

    <div class="controls">
        <div class="control-group">
            <label>期待リターン ($\mu$):</label>
            <input type="number" id="muInput" value="0.537" step="0.01">
        </div>
        <div class="control-group">
            <label>リスク・ボラティリティ ($\sigma$):</label>
            <input type="number" id="sigmaInput" value="0.704" step="0.01">
        </div>
        <div class="control-group">
            <label>初期投資額 (万円):</label>
            <input type="number" id="v0Input" value="100.0" step="10">
        </div>
        <div class="control-group">
            <label>運用上限期間 (年):</label>
            <input type="number" id="maxYearsInput" value="30">
        </div>
        <div class="control-group" style="grid-column: span 2;">
            <label>破綻とみなす累計追加手出しの閾値 (万円):</label>
            <input type="number" id="bankruptcyThresholdInput" value="150.0" step="10">
        </div>
        <button id="runBtn">シミュレーション実行</button>
    </div>

    <div class="results" id="resultsArea" style="display: none;">
        <h2>シミュレーション結果（総合KPI）</h2>
        <div class="metric">1. 実質破綻確率 (%): <span id="failRate">-</span></div>
        <div class="metric">2. 追加手出し額の分布 (P50 / P90 / P99): <span id="injectionDist">-</span></div>
        <div class="metric">3. 税引き後 最終総資産額の分布 (P10 / P50 / P90): <span id="p50Asset">-</span></div>
        <div class="metric">4. 累積納税総額 (中央値): <span id="taxTotal">-</span></div>
        <div class="metric">5. 目標達成期間の分布 (達成率 / 中央値・平均・P5・P95): <span id="achievementDist">-</span></div>
    </div>

    <script src="script.js"></script>
</body>
</html>