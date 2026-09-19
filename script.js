let myChart = null; // グラフのインスタンス保持用

document.addEventListener('DOMContentLoaded', () => {
    const runBtn = document.getElementById('runBtn');
    if (!runBtn) {
        console.error("runBtnが見つかりません");
        return;
    }

    runBtn.addEventListener('click', () => {
        try {
            // 画面の入力値を取得
            const mu = parseFloat(document.getElementById('muInput').value);
            const sigma = parseFloat(document.getElementById('sigmaInput').value);
            const initialV = parseFloat(document.getElementById('v0Input').value);
            const maxYears = parseInt(document.getElementById('maxYearsInput').value);
            const bankruptcyThreshold = parseFloat(document.getElementById('bankruptcyThresholdInput').value);

            const numTrials = 3000; 
            const taxRate = 0.20315;
            const initialAnchor = initialV;

            // 対数正規分布のパラメータ計算
            const sigmaLog = Math.sqrt(Math.log(1 + Math.pow(sigma / (1 + mu), 2)));
            const muLog = Math.log(1 + mu) - (sigmaLog * sigmaLog) / 2.0;

            // 集計用配列
            let failureCount = 0;
            let totalAddedCapitals = [];
            let finalAssets = [];
            let totalTaxesPaid = [];
            let yearsNeeded = [];
            let achievedCount = 0;

            for (let i = 0; i < numTrials; i++) {
                let vT = initialV;          
                let bT = initialV;          
                let cReal = 0.0;            
                let iTotal = 0.0;           
                let taxTotal = 0.0;         
                let anchor = initialAnchor; 
                let isFailed = false;
                let achievedYear = null;

                for (let t = 1; t <= maxYears; t++) {
                    let u1 = Math.max(1e-7, Math.random());
                    let u2 = Math.random();
                    let z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
                    let rT = Math.exp(muLog + sigmaLog * z) - 1;
                    
                    let vPrime = vT * (1 + rT);
                    if (vPrime < 0) vPrime = 0;

                    let targetTQQQ = anchor / 2.0;
                    let delta = vPrime - targetTQQQ;

                    if (delta > 0) { 
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
                        let needed = Math.abs(delta);
                        let fromCash = Math.min(cReal, needed);
                        let add = needed - fromCash;

                        cReal -= fromCash;
                        iTotal += add;
                        bT += needed;
                        vT = targetTQQQ;
                    }

                    anchor = Math.max(anchor, vT + cReal);

                    if (achievedYear === null && cReal >= vT) {
                        achievedYear = t;
                    }

                    if (vT + cReal <= 0 || iTotal > bankruptcyThreshold) {
                        isFailed = true;
                        break;
                    }
                }

                if (isFailed) {
                    failureCount++;
                    yearsNeeded.push(maxYears);
                } else {
                    if (achievedYear !== null) {
                        achievedCount++;
                        yearsNeeded.push(achievedYear);
                    } else {
                        yearsNeeded.push(maxYears);
                    }
                }

                totalAddedCapitals.push(iTotal);
                finalAssets.push(vT + cReal);
                totalTaxesPaid.push(taxTotal);
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

            const failRate = (failureCount / numTrials) * 100;
            const medCapital = getPercentile(totalAddedCapitals, 50);
            const p90Capital = getPercentile(totalAddedCapitals, 90);
            const p99Capital = getPercentile(totalAddedCapitals, 99);

            const p10Asset = getPercentile(finalAssets, 10);
            const p50Asset = getPercentile(finalAssets, 50);
            const p90Asset = getPercentile(finalAssets, 90);

            const medTax = getPercentile(totalTaxesPaid, 50);

            const achievementRate = (achievedCount / numTrials) * 100;
            const medYears = getPercentile(yearsNeeded, 50);
            const avgYears = getAverage(yearsNeeded);
            const p5Years = getPercentile(yearsNeeded, 5);
            const p95Years = getPercentile(yearsNeeded, 95);

            // テキストの反映
            document.getElementById('failRate').textContent = `${failRate.toFixed(2)}% (破綻閾値: ${bankruptcyThreshold}万円超過または資産枯渇)`;
            document.getElementById('injectionDist').textContent = `中央値（標準）: ${medCapital.toFixed(1)} 万円 ／ 多め（上位10%の負担）: ${p90Capital.toFixed(1)} 万円 ／ 極端な大暴落（上位1%）: ${p99Capital.toFixed(1)} 万円`;
            document.getElementById('p50Asset').textContent = `中央値（標準）: ${Math.round(p50Asset).toLocaleString()} 万円 （保守的・下位10%: ${Math.round(p10Asset).toLocaleString()}万 ／ 楽観的・上位10%: ${Math.round(p90Asset).toLocaleString()}万）`;
            document.getElementById('taxTotal').textContent = `${medTax.toFixed(1)} 万円`;
            document.getElementById('achievementDist').textContent = `達成率: ${achievementRate.toFixed(1)}% | 中央値: ${medYears}年 (平均: ${avgYears.toFixed(1)}年) ／ 最速ペース: ${p5Years}年 ／ 時間がかかるケース: ${p95Years}年`;

            document.getElementById('resultsArea').style.display = 'block';

            // --- グラフの描画 (Chart.js) ---
            const ctx = document.getElementById('resultChart').getContext('2d');
            
            // 既にグラフが存在する場合は一度破棄して再描画する
            if (myChart) {
                myChart.destroy();
            }

            myChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['下位10%（保守的）', '中央値（標準）', '上位10%（楽観的）'],
                    datasets: [{
                        label: '税引き後 最終総資産額 (万円)',
                        data: [Math.round(p10Asset), Math.round(p50Asset), Math.round(p90Asset)],
                        backgroundColor: ['rgba(54, 162, 235, 0.6)', 'rgba(46, 164, 79, 0.6)', 'rgba(255, 159, 64, 0.6)'],
                        borderColor: ['rgba(54, 162, 235, 1)', 'rgba(46, 164, 79, 1)', 'rgba(255, 159, 64, 1)'],
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: '最終総資産額のシナリオ別比較',
                            font: { size: 16 }
                        },
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            title: {
                                display: true,
                                text: '万円'
                            }
                        }
                    }
                }
            });

        } catch (error) {
            console.error("エラー詳細:", error);
            alert("計算中にエラーが発生しました。コンソールを確認してください。");
        }
    });
});