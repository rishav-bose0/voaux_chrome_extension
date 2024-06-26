chrome.runtime.onMessage.addListener((message) => {

    if (message.action === 'timeUpdate') {
        chrome.storage.local.set({ 'prevTime': message.currentTime + 0.1 });
    }

    if (message.action === 'playbackSpeed') {
        chrome.storage.local.set({ 'speedRate': message.speedRate });
    }

    if (message.action === 'urlUpdate') {
        console.log("Received url update message with audio url " + message.audioUrl);
        chrome.storage.local.set({ 'prevSource': message.audioUrl });
        chrome.runtime.sendMessage({ dest:"toMain", audioUrlUpdate: message.audioUrl});
    }

    if (message.action === 'end') {
        console.log("Received offscreen of end");
    }

    if (message.action === 'processTTSAPICall') {
        processTTSAPICall(message.body);
    }
});

async function processTTSAPICall(bodyReq) {
    await clearAudioQueue()

    for (const req of bodyReq) {
            const startTime = performance.now(); // Record start time for each request
            console.log(req);
            try {
                const response = await fetch('https://seashell-app-qf57f.ondigitalocean.app/api/v1/tts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(req),
                });

                const endTime = performance.now();
                const totalTime = (endTime - startTime) / 1000;
                if (response.ok) {
                    const data = await response.json();
                    const audioUrl = data.speech_s3_link;
                    await sendAudioUrl(audioUrl);
                } else {
                    let responseCode = response.status;
                    chrome.runtime.sendMessage({ dest:"toMain", error: responseCode});
                }
            } catch (error) {
                console.log('Error:', error);
            }
        }
}

async function clearAudioQueue() {
    await chrome.runtime.sendMessage({dest:"toOffscreen",  clearAudioQueue: true});
}

async function sendAudioUrl(source) {
    await createOffscreen();
    await chrome.runtime.sendMessage({dest:"toOffscreen",  audioUrl: source});
}

// Create the offscreen document if it doesn't already exist
async function createOffscreen() {
    if (await chrome.offscreen.hasDocument()) return;
    await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['USER_MEDIA'],
        justification: 'testing' // details for using the API
    });
}

