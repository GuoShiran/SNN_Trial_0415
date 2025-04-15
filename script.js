// 视频控制
const video = document.getElementById('video');
const videoSource = document.getElementById('video-source');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const loadBtn = document.getElementById('load-btn');
const videoUrlInput = document.getElementById('video-url');
const progressBar = document.getElementById('progress-bar');
const timeDisplay = document.getElementById('time-display');
const feedbackModal = document.getElementById('feedback-modal');
const currentTimeSpan = document.getElementById('current-time');
const feedbackInput = document.getElementById('feedback-input');
const submitBtn = document.getElementById('submit-btn');
const feedbackItems = document.getElementById('feedback-items');

let isLabeling = false;
let checkInterval;
const ANNOTATION_INTERVAL = 0.1; // 0.1秒间隔

// 初始化Firebase
let db;
function initFirebase() {
    try {
        db = firebase.firestore();
        console.log("Firebase 初始化成功");
    } catch (e) {
        console.error("Firebase 初始化失败:", e);
        alert("数据存储功能不可用，反馈将仅保存在本地");
    }
}

// 加载视频
loadBtn.addEventListener('click', () => {
    const url = videoUrlInput.value.trim();
    if (url) {
        videoSource.src = url;
        video.load();
        alert("视频已加载，点击播放按钮预览");
    }
});

// 开始标注
startBtn.addEventListener('click', () => {
    if (!videoSource.src) {
        alert("请先加载视频");
        return;
    }
    
    isLabeling = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    video.currentTime = 0;
    
    video.play().then(() => {
        checkInterval = setInterval(checkTime, 50); // 每50ms检查一次
    }).catch(e => {
        alert("播放失败: " + e.message);
        stopLabeling();
    });
});

// 停止标注
stopBtn.addEventListener('click', stopLabeling);

function stopLabeling() {
    isLabeling = false;
    clearInterval(checkInterval);
    video.pause();
    startBtn.disabled = false;
    stopBtn.disabled = true;
}

// 检查时间
function checkTime() {
    if (!isLabeling) return;
    
    updateProgress();
    
    // 检查是否到达间隔点
    const current = video.currentTime;
    if (current % ANNOTATION_INTERVAL < 0.05) {
        video.pause();
        showFeedbackModal(current);
    }
}

// 显示反馈弹窗
function showFeedbackModal(time) {
    currentTimeSpan.textContent = time.toFixed(2);
    feedbackInput.value = '';
    feedbackModal.style.display = 'flex';
    feedbackInput.focus();
}

// 提交反馈
submitBtn.addEventListener('click', () => {
    const time = parseFloat(currentTimeSpan.textContent);
    const text = feedbackInput.value.trim();
    
    if (text) {
        saveFeedback(time, text);
        feedbackModal.style.display = 'none';
        
        if (isLabeling) {
            video.play().catch(e => {
                alert("继续播放失败: " + e.message);
                stopLabeling();
            });
        }
    } else {
        alert("请输入反馈内容");
    }
});

// 保存反馈到Firebase
async function saveFeedback(time, text) {
    const feedback = {
        timestamp: time,
        text: text,
        videoUrl: videoSource.src,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // 添加到页面
    addFeedbackToUI(feedback);
    
    // 尝试保存到Firebase
    if (db) {
        try {
            await db.collection("feedbacks").add(feedback);
            console.log("反馈已保存到数据库");
        } catch (e) {
            console.error("保存失败:", e);
            // 本地存储作为后备
            saveToLocalStorage(feedback);
        }
    } else {
        saveToLocalStorage(feedback);
    }
}

// 添加到UI列表
function addFeedbackToUI(feedback) {
    const item = document.createElement('div');
    item.className = 'feedback-item';
    item.innerHTML = `
        <span class="timestamp">${feedback.timestamp.toFixed(2)}s</span>
        <span>${feedback.text}</span>
    `;
    feedbackItems.appendChild(item);
}

// 本地存储后备
function saveToLocalStorage(feedback) {
    let feedbacks = JSON.parse(localStorage.getItem('videoFeedbacks') || [];
    feedbacks.push(feedback);
    localStorage.setItem('videoFeedbacks', JSON.stringify(feedbacks));
}

// 更新进度条
function updateProgress() {
    const percent = (video.currentTime / video.duration) * 100;
    progressBar.style.width = `${percent}%`;
    timeDisplay.textContent = 
        `${video.currentTime.toFixed(2)}s / ${video.duration.toFixed(2)}s`;
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initFirebase();
    
    // 加载本地存储的反馈
    const localFeedbacks = JSON.parse(localStorage.getItem('videoFeedbacks')) || [];
    localFeedbacks.forEach(addFeedbackToUI);
});
