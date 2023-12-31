chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'popup_paused' || message.action === 'popup_end') {
        console.log("Received message about "+ message.action);
    }

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
    console.log("Length of bodyReq " + bodyReq.length);

    await clearAudioQueue()

    for (const req of bodyReq) {
            const startTime = performance.now(); // Record start time for each request
            console.log(req);
            try {
                const response = await fetch('https://seashell-app-qf57f.ondigitalocean.app/api/v1/process_tts', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwYXlsb2FkIjoie1wiaWRcIjoge1wiaWRcIjogXCJOQmllYjNsUWQ1MEVmbVwifSwgXCJlbWFpbFwiOiBcInR0YW4uYWdnckBnbWFpbC5jb21cIiwgXCJwcml2aWxlZ2VfdHlwZVwiOiBcImZyZWVcIiwgXCJmaXJzdF9uYW1lXCI6IFwidHRhblwiLCBcImxhc3RfbmFtZVwiOiBcImFnZ3JcIiwgXCJwYXNzd29yZFwiOiBcInR0YW4xMjM0XCIsIFwidG9rZW5cIjogXCJleUpoYkdjaU9pSklVekkxTmlJc0luUjVjQ0k2SWtwWFZDSjkuZXlKd1lYbHNiMkZrSWpvaWUxd2lhV1JjSWpvZ2Uxd2lhV1JjSWpvZ1hDSmNJbjBzSUZ3aVpXMWhhV3hjSWpvZ1hDSjBkR0Z1TG1GblozSkFaMjFoYVd3dVkyOXRYQ0lzSUZ3aWNISnBkbWxzWldkbFgzUjVjR1ZjSWpvZ1hDSm1jbVZsWENJc0lGd2labWx5YzNSZmJtRnRaVndpT2lCY0luUjBZVzVjSWl3Z1hDSnNZWE4wWDI1aGJXVmNJam9nWENKaFoyZHlYQ0lzSUZ3aWNHRnpjM2R2Y21SY0lqb2dYQ0owZEdGdU1USXpORndpTENCY0luUnZhMlZ1WENJNklGd2lYQ0o5SWl3aVpYaHdJam94TnpBek1EVXhNVGc0ZlEubE5WUFViTHQyNTFnckhvbFotZnBDa3NnYlFVcmZTYmwwQlBUZkUxMFpYZ1wifSIsImV4cCI6MTcwNDA5OTkyNX0.4FthynUauyjSN4XJdw94RqPJ0XkZu5FSX5sWtkYVe9o'
                    },
                    body: JSON.stringify([req]),
                });

                const endTime = performance.now();
                const totalTime = (endTime - startTime) / 1000;
                console.log(`Response received in ${totalTime} seconds.`);
                if (response.ok) {
                    const data = await response.json();
                    const audioUrl = data.speech_s3_link;
                    console.log("audio url " + audioUrl);
                    await sendAudioUrl(audioUrl);
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
    console.log("Creating another offscreen");
    await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['USER_MEDIA'],
        justification: 'testing' // details for using the API
    });
}

