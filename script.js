// 视频元素
const video = document.getElementById('myVideo');
const inputPrompt = document.getElementById('inputPrompt');
const userInput = document.getElementById('userInput');
const status = document.getElementById('status');
let intervalId = null;
let collectedData = [];

// 每 0.1 秒暂停并提示输入
function startPausing() {
    intervalId = setInterval(() => {
        if (!video.paused) {
            video.pause();
            showInputPrompt();
        }
    }, 100); // 0.1 秒 = 100 毫秒
}

// 显示输入提示
function showInputPrompt() {
    inputPrompt.style.display = 'block';
    userInput.value = '';
    userInput.focus();
    status.textContent = '等待用户输入';
}

// 提交用户输入
function submitInput() {
    const inputValue = userInput.value.trim();
    if (inputValue === '') {
        alert('请输入有效结果！');
        return;
    }

    // 记录数据
    const data = {
        timestamp: new Date().toISOString(),
        videoTime: video.currentTime.toFixed(2), // 保留 2 位小数
        userInput: inputValue
    };
    collectedData.push(data);

    // 更新状态
    status.textContent = `已记录：时间=${data.videoTime}s, 输入=${data.userInput}`;

    // 隐藏输入框并继续播放
    inputPrompt.style.display = 'none';
    video.play();

    // 发送数据（可选：调用 Google Sheets API）
    sendDataToGoogleSheets(data);
}

// 视频播放开始时启动暂停逻辑
video.addEventListener('play', () => {
    if (!intervalId) {
        startPausing();
    }
});

// 视频暂停时清除定时器（防止手动暂停触发多余逻辑）
video.addEventListener('pause', () => {
    if (intervalId && inputPrompt.style.display !== 'block') {
        clearInterval(intervalId);
        intervalId = null;
    }
});

// 视频结束时停止并显示数据
video.addEventListener('ended', () => {
    clearInterval(intervalId);
    intervalId = null;
    status.textContent = '视频已结束，数据已收集';
    console.log('收集的数据：', collectedData);
    alert('数据收集完成，请检查控制台或后端记录！');
});

// Google Sheets API 设置
const CLIENT_ID = '413262948577-ftjqvabftsu94c46b684s606sjka0ogt.apps.googleusercontent.com';
const API_KEY = 'AIzaSyB-IJvPI-umRSFCl26-50-CMOhL6Bgt7Iw';
const SPREADSHEET_ID = '1Ivu2k28j8Q5HmtOpK7ya33YnsRX3UBmZH6J_mS-1D2k';
const DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

function initGoogleSheets() {
    gapi.load('client:auth2', () => {
        gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES
        }).then(() => {
            console.log('Google Sheets API 初始化成功');
        }).catch((error) => {
            console.error('Google Sheets API 初始化失败:', error);
        });
    });
}

// 发送数据到 Google Sheets
function sendDataToGoogleSheets(data) {
    gapi.client.sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A:C', // 假设数据写入 Sheet1 的 A、B、C 列
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        resource: {
            values: [[data.timestamp, data.videoTime, data.userInput]]
        }
    }).then((response) => {
        console.log('数据已发送到 Google Sheets:', response);
    }).catch((error) => {
        console.error('发送数据失败:', error);
    });
}

// 初始化 Google Sheets API（需手动触发授权）
document.addEventListener('DOMContentLoaded', () => {
    initGoogleSheets();
});
