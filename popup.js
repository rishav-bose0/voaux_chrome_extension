function onError(error) {
    console.log("Error: " + error);
}

let isPaused = false;
let playbackRate;
chrome.storage.local.get(['playbackRate'], function (result) {
    playbackRate = result.playbackRate;
});

function getReqLoadBasedOnText(text, speakerId, speechSpeed) {

    let maxWordCount = 60
    text = sanitizeText(text)
    const words = text.toString().split(/\s+/);
    const wordCount = words.length
    let reqPayload = []
    if (wordCount > maxWordCount) {
        const truncatedText = words.slice(0, maxWordCount).join(' '); // Limiting to 100 words
        reqPayload.push(createTTSPayload(truncatedText, speakerId, speechSpeed));
        const remainingText = words.slice(maxWordCount).join(' ');

        // Split the remaining text into chunks of maxWordCount words
        const remainingWords = remainingText.split(' ');
        const chunkedText = [];
        while (remainingWords.length > 0) {
            let remWords = remainingWords.splice(0, maxWordCount).join(' ')
            reqPayload.push(createTTSPayload(remWords, speakerId, speechSpeed));
        }
    } else {
        reqPayload.push(createTTSPayload(text, speakerId, speechSpeed));
    }
    return reqPayload;
}

function createTTSPayload(textReq, speakerId, speechSpeed) {
    return {
        text: textReq.toString(),
        language: 'en',
        speaker_id: speakerId,
        duration: speechSpeed,
        pitch: 0,
    };
}

function sanitizeText(text) {
    const strText = String(text)
    const sanitizedText = strText.replace(/[\u2018\u2019]/g, "'")
        .replace(/[\u201C\u201D]/g, '"').replace(/["'\\]/g, ''); // Replace quotes, single quotes, and backslashes
    // Replace newline characters with a space
    let cleanedText = sanitizedText.replace(/\n/g, ' ... ');
    cleanedText = cleanedText.replace(/\[\d+]/g, '');
    cleanedText = cleanedText.replace(/[;]/g, '.');
    return cleanedText;
}


async function processTTSApi(selectedText, speakerId, speechSpeed) {
    const selectedTextElement = document.getElementById('fixedAudioBlock');
    console.log(selectedTextElement)
    selectedTextElement.innerHTML = '<p style="font-weight: bold;font-size: 13px">Please do not close the extension untill loading is complete!</p>';
    // selectedTextElement.textContent = selectedText;
    const loadingIndicator = document.createElement('img');
    loadingIndicator.src = 'img_files/Loader.svg'; // Replace with your loading GIF URL
    loadingIndicator.style.height = '70px';

    selectedTextElement.style.display = 'flex';
    selectedTextElement.style.justifyContent = 'center';
    selectedTextElement.style.alignItems = 'center';

    selectedTextElement.appendChild(loadingIndicator);

    const bodyReq = getReqLoadBasedOnText(selectedText, speakerId, speechSpeed)
    chrome.runtime.sendMessage({action: 'processTTSAPICall', body: bodyReq});
}

export function playNextAudio(audioUrl, startTime = undefined) {
    const selectedTextElement = document.getElementById('fixedAudioBlock');
    selectedTextElement.innerHTML = '';
    console.log("Audio url is " + audioUrl);

    const audioElement = document.createElement('audio');
    audioElement.src = audioUrl;
    audioElement.controls = true;
    audioElement.setAttribute('muted', '');
    audioElement.volume = 0;
    audioElement.controlsList = "nodownload novolume";
    audioElement.autoplay = true;
    if (startTime !== undefined) {
        audioElement.currentTime = startTime;
    }
    if (playbackRate !== undefined) {
        console.log("playback added " + playbackRate);
        audioElement.playbackRate = playbackRate;
    } else {
        chrome.storage.local.get(['playbackRate'], function (result) {
            if (result.playbackRate !== undefined) {
                playbackRate = result.playbackRate;
            }
        });
    }
    selectedTextElement.appendChild(audioElement);


    audioElement.addEventListener('pause', () => {
        console.log("Paused");
        if (Math.ceil(audioElement.currentTime) !== Math.ceil(audioElement.duration)) {
            isPaused = true;
            chrome.runtime.sendMessage({
                dest: 'toOffscreen',
                action: 'pause',
                currentTime: audioElement.currentTime,
                duration: audioElement.duration
            });
            chrome.storage.local.set({'prevTime': audioElement.currentTime});
        }
    });

    audioElement.addEventListener('play', () => {

        isPaused = false;
        // chrome.runtime.sendMessage({
        //     dest: 'toOffscreen', action: 'play', currentTime: audioElement.currentTime,
        //     duration: audioElement.duration
        // });
    });

    // chrome.storage.local.set({ 'prevSource': audioUrl });
    audioElement.addEventListener('input', () => {
        if (!isPaused) {
            chrome.runtime.sendMessage({dest: 'toOffscreen', action: 'resume', startTime: audioElement.currentTime});
        }
    });

    audioElement.addEventListener('timeupdate', () => {
        if (!isPaused) {
            chrome.runtime.sendMessage({dest: 'toOffscreen', action: 'resume', startTime: audioElement.currentTime});
        }
    });


    audioElement.addEventListener('ratechange', () => {
        const currentSpeed = audioElement.playbackRate;
        playbackRate = currentSpeed;
        chrome.runtime.sendMessage({dest: 'toOffscreen', action: 'speedChanged', speedRate: currentSpeed});
    });
}

export function handleTextSelection(speakerId, speechSpeed) {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        const currentTab = tabs[0];
        chrome.scripting.executeScript({
            target: {tabId: currentTab.id},
            function: () => {
                const selectedText = window.getSelection().toString();
                return selectedText;
            },
        }).then((result) => {
            const selectedText = result[0].result;
            processTTSApi(selectedText, speakerId, speechSpeed)
        }).catch(onError);
    });
}


chrome.runtime.onMessage.addListener((message) => {
    if (message.dest === "toMain") {
        if (message.audioUrlUpdate) {
            console.log("Received message in popup");
            console.log(message);
            playNextAudio(message.audioUrlUpdate);
        }
        if (message.newTTS) {
            const selectedTextElement = document.getElementById('fixedAudioBlock');
            selectedTextElement.innerHTML = '';
        }
        if (message.error) {
            const selectedTextElement = document.getElementById('fixedAudioBlock');
            selectedTextElement.innerHTML = `
<p> Received error 
        <span style="margin-right: 5px;"></span> <!-- Adding space -->
        <p style="color: red; font-weight: bold; display: inline;"> code ${message.error} </p>
        <span style="margin-left: 5px;"></span> <!-- Adding space -->
        <span>from server.</span>
    </p>
`;
            selectedTextElement.style.height = '70px';
            selectedTextElement.style.fontSize = '15px';

        }
    }
});