
let audioQueue = [];
let isPlaying = false;
let playbackRate;

chrome.runtime.onMessage.addListener(msg => {
    if (msg.dest === "toOffscreen") {
        if (msg.action === 'resume') resume(msg.startTime);
        if (msg.action === 'pause') {
            pauseAudio();
        }
        if (msg.clearAudioQueue) {
            clearQueue();
        }
        if (msg.action === 'play') {
        }

        if (msg.action === 'audioEnded') {
            console.log("Received audioEnded message");
            // pauseAudio();
        }
        if (msg.action === 'end') {
            console.log("Received end message");
            // pauseAudio();
        }
        if (msg.action === 'speedChanged') speedChanged(msg.speedRate);
        if (msg.audioUrl) {
            console.log("Received message to push url " + msg.audioUrl);
            audioQueue.push(msg.audioUrl);
            playNextAudio()
        }
    }
});

function clearQueue() {
    const fixedAudioBlock = document.getElementById('OffscreenAudioBlock');
    fixedAudioBlock.innerHTML = '';
    isPlaying = false;
    audioQueue=[];
    console.log("Cleared. AudioQueue now - ");
    console.log(audioQueue);

}
function playNextAudio() {
    if (!isPlaying && audioQueue.length > 0) {
        // const selectedTextElement = document.getElementById('OffscreenAudioBlock');
        // selectedTextElement.innerHTML = '';
        console.log("inside playNextAudio ");
        console.log(audioQueue);
        const audioUrl = audioQueue.shift();
        console.log("Playing next audio " + audioUrl);
        isPlaying = true;
        playAudio(audioUrl, 0);
        chrome.runtime.sendMessage({action: 'urlUpdate', audioUrl: audioUrl});
    }
}

// Play sound with access to DOM APIs
function playAudio(source, startTime) {
    // const audio = new Audio(source);
    console.log("Playing" + source);
    const fixedAudioBlock = document.getElementById('OffscreenAudioBlock');
    fixedAudioBlock.innerHTML = '';
    const audioElement = document.createElement('audio');
    audioElement.src = source;
    audioElement.controls = true;
    audioElement.currentTime = startTime;
    audioElement.autoplay = true;
    if(playbackRate !== undefined){
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
    let timeDiff = Math.abs(audioElement.currentTime - startTime)
    if(timeDiff > 2){
        console.log(timeDiff);
        audioElement.currentTime = startTime;
        audioElement.play();
    }
}