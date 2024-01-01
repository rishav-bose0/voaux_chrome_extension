let audioQueue = [];
let isPlaying = false;
let playbackRate;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.dest === "toOffscreen") {
        if (msg.loadResult) sendResponse(true);
        if (msg.action === 'resume') resume(msg.startTime);
        if (msg.action === 'pause') pauseAudio();
        if (msg.clearAudioQueue) clearQueue();
        if (msg.action === 'speedChanged') speedChanged(msg.speedRate);
        if (msg.action === 'end') {
            console.log("Received end message");
        }
        if (msg.audioUrl) {
            console.log("Received message to push url " + msg.audioUrl);
            audioQueue.push(msg.audioUrl);
            playNextAudio()
        }
    }
});

function clearQueue() {
    const fixedAudioBlock = document.getElementById('OffscreenAudioBlock');
    if (fixedAudioBlock === null) {
        return;
    }
    fixedAudioBlock.innerHTML = '';
    isPlaying = false;
    playbackRate = undefined;
    audioQueue = [];
}

function playNextAudio() {
    if (!isPlaying && audioQueue.length > 0) {
        const audioUrl = audioQueue.shift();
        isPlaying = true;
        playAudio(audioUrl, 0);
        chrome.runtime.sendMessage({action: 'urlUpdate', audioUrl: audioUrl});
    }
}

// Play sound with access to DOM APIs
function playAudio(source, startTime) {
    console.log("Playing " + source);
    const fixedAudioBlock = document.getElementById('OffscreenAudioBlock');
    console.log(fixedAudioBlock);
    fixedAudioBlock.innerHTML = '';
    const audioElement = document.createElement('audio');
    audioElement.src = source;
    audioElement.controls = true;
    audioElement.currentTime = startTime;
    audioElement.autoplay = true;
    if (playbackRate !== undefined) {
        audioElement.playbackRate = playbackRate;
    }

    audioElement.addEventListener('timeupdate', () => {
        chrome.runtime.sendMessage({action: 'timeUpdate', currentTime: audioElement.currentTime});
    });
    audioElement.addEventListener('ended', () => {
        chrome.runtime.sendMessage({action: 'end'});
        isPlaying = false;
        playNextAudio(); // Play the next audio in the queue
    });

    fixedAudioBlock.appendChild(audioElement);

}

function speedChanged(speedRate) {
    const audioElement = document.querySelector('audio');
    audioElement.playbackRate = speedRate;
    playbackRate = speedRate
    chrome.runtime.sendMessage({action: 'playbackSpeed', speedRate: speedRate});
}

function pauseAudio() {
    console.log("Pausing");
    const audioElement = document.querySelector('audio');
    audioElement.pause();
}

function resume(startTime) {
    console.log("Resuming");
    const audioElement = document.querySelector('audio');
    if (audioElement === undefined) {
        return;
    }
    let timeDiff = Math.floor(Math.abs(audioElement.currentTime - startTime))
    if (timeDiff > 1 || audioElement.duration < 3) {
        console.log(timeDiff);
        audioElement.currentTime = startTime;
        audioElement.play();
    }
}