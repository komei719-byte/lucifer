const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const countSpan = document.getElementById('count');
const piSpan = document.getElementById('pi');

const width = canvas.width;
const height = canvas.height;
const radius = width; // キャンバスのサイズを四分円の半径とする

let totalPoints = 0;
let insidePoints = 0;
let isRunning = false;
let animationId = null;

// キャンバスの初期化
function drawBackground() {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = '#000';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI / 2);
    ctx.stroke();
}

drawBackground();

// 1ステップのシミュレーション
function step() {
    // 1フレームあたりに処理する試行回数（ブラウザが重くならないよう調整）
    for (let i = 0; i < 100; i++) {
        const x = Math.random();
        const y = Math.random();
        totalPoints++;

        if (x * x + y * y <= 1) {
            insidePoints++;
            ctx.fillStyle = 'red'; // 円の内側
        } else {
            ctx.fillStyle = 'blue'; // 円の外側
        }

        // キャンバスに点を描画（座標をスケーリング）
        ctx.fillRect(x * width, y * height, 2, 2);
    }

    // 画面の数値を更新
    const estimatedPi = 4 * (insidePoints / totalPoints);
    countSpan.textContent = totalPoints.toLocaleString();
    piSpan.textContent = estimatedPi.toFixed(6);

    if (isRunning) {
        animationId = requestAnimationFrame(step);
    }
}

// 開始ボタン
startBtn.addEventListener('click', () => {
    if (!isRunning) {
        isRunning = true;
        startBtn.textContent = '一時停止';
        step();
    } else {
        isRunning = false;
        startBtn.textContent = '再開';
        cancelAnimationFrame(animationId);
    }
});

// リセットボタン
resetBtn.addEventListener('click', () => {
    isRunning = false;
    cancelAnimationFrame(animationId);
    startBtn.textContent = 'シミュレーション開始';
    totalPoints = 0;
    insidePoints = 0;
    countSpan.textContent = '0';
    piSpan.textContent = '0.000000';
    drawBackground();
});