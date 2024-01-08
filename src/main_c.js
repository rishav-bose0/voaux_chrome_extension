import {handleTextSelection} from "./popup.js";
import {playNextAudio} from "./popup.js";

const apiUrlSpeakerDetails = process.env.API_URL_SPEAKER_DETAILS;

function onError(error) {
    console.log("Error: " + error);
}

async function fetchAndCreateImageBlocks() {
    try {
        let prevHighlightedBlock = 0;
        await chrome.storage.local.get(['highlightedBlock'], function (result) {
            if (result.highlightedBlock !== undefined) {
                prevHighlightedBlock = result.highlightedBlock;
            }
        });

        await chrome.storage.local.get(['speakerDetails'], async function (result) {
            if (result.speakerDetails !== undefined) {
                createSpeakerDetailsBlock(result.speakerDetails, prevHighlightedBlock);
            } else {
                const response = await fetch(apiUrlSpeakerDetails, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                })
                    .then(response => response.json())
                    .then(data => {
                        createSpeakerDetailsBlock(data, prevHighlightedBlock);
                        chrome.storage.local.set({'speakerDetails': data});
                    })
                    .catch(onError);
            }
        })

    } catch (error) {
        console.error('Error:', error);
    }
}

function createSpeakerDetailsBlock(data, prevHighlightedBlock) {
    // console.log("Response recived.")
    const imageBlocksContainer = document.getElementById('imageBlocksContainer');

    let currentAudio = null;
    let prevOpenRange = null;
    // Create image blocks for each item in the data response
    data.forEach((item, index) => {
        const aiVoiceBlock = document.createElement('div');
        aiVoiceBlock.classList.add('aiVoiceBlock');
        // Set block content with gender and ID
        const image = document.createElement('img');
        image.src = item.Img_url;
        image.style.width = '80px';
        image.classList.add('circular-image');
        image.src = 'img_files/faces/id_' + item.Id + '.png';


        aiVoiceBlock.appendChild(image);
        aiVoiceBlock.innerHTML += `<p style="font-weight: bold">${item.Name} (${item.Gender})</p>`;
        const voiceBlock = document.createElement('div');
        voiceBlock.className = "voiceBlock"

        const playSampleButton = document.createElement('button');
        playSampleButton.innerHTML = "Sample Voice";
        playSampleButton.classList.add("Button")

        const playTextButton = document.createElement('button');
        playTextButton.innerHTML = "Play Text";
        playTextButton.classList.add("Button")
        voiceBlock.appendChild(playSampleButton)
        voiceBlock.appendChild(playTextButton)
        aiVoiceBlock.appendChild(voiceBlock)


        const durationButton = document.createElement('button');
        durationButton.innerHTML = `<img src=img_files/speed.png title= "playback speed" style="width: 20px; height: 20px">`;
        durationButton.classList.add("Button2");

        const rangeDiv = document.createElement('div');
        rangeDiv.classList.add('range');

        const rangeInput = document.createElement('input');
        rangeInput.type = 'range';
        rangeInput.value = '1';
        rangeInput.min = '0';
        rangeInput.max = '2';
        rangeInput.step = '0.25';
        const rangeValue = document.createElement('p');
        rangeValue.id = 'rangeValue';
        rangeValue.innerText = 'Speed: 1x';
        rangeInput.addEventListener('input', () => {
            rangeValue.innerText = 'Speed: ' + rangeInput.value + 'x';
        });
        // Append elements to the range div
        rangeDiv.appendChild(rangeInput);
        rangeDiv.appendChild(rangeValue);


        rangeDiv.style.display = "none";
        durationButton.addEventListener('click', () => {
            if (prevOpenRange && prevOpenRange !== rangeDiv) {
                prevOpenRange.style.display = "none";
            }

            if (rangeDiv.style.display === "none") {
                rangeDiv.style.display = "block"; // Show the slider
                prevOpenRange = rangeDiv;
            } else {
                rangeDiv.style.display = "none"; // Hide the slider
            }
        });

        rangeDiv.addEventListener('mouseup', () => {
            rangeDiv.style.display = "none";
        })


        playSampleButton.addEventListener('click', () => {

            if (currentAudio) {
                currentAudio.pause(); // Pause the currently playing audio
            }

            const audioElement = document.createElement('audio');
            audioElement.src = item.Preview_link;
            audioElement.controls = true;
            audioElement.autoplay = true;
            currentAudio = audioElement;
        });

        if (prevHighlightedBlock === index) {
            aiVoiceBlock.classList.add('highlighted');
        }

        playTextButton.addEventListener('click', () => {

            // Remove highlight from previously selected block
            const highlightedBlock = document.querySelector('.aiVoiceBlock.highlighted');
            if (highlightedBlock) {
                highlightedBlock.classList.remove('highlighted');
            }

            // Highlight the current block
            aiVoiceBlock.classList.add('highlighted');
            chrome.storage.local.set({'highlightedBlock': index});

            const speakerId = item.Id;
            const speechSpeed = 1 / rangeInput.value + 0.33;
            handleTextSelection(speakerId, speechSpeed);
        });

        // durationButton.appendChild(rangeDiv);
        aiVoiceBlock.appendChild(durationButton)
        aiVoiceBlock.appendChild(rangeDiv)
        // Append block to the container
        imageBlocksContainer.appendChild(aiVoiceBlock);
    });
}

// Call fetchAndCreateImageBlocks when the popup is opened
document.addEventListener('DOMContentLoaded', function () {
    fetchAndCreateImageBlocks(); // Load image blocks on page load
    createPreviewAudioBlock();
});

function createPreviewAudioBlock() {
    if (chrome.offscreen.hasDocument()) {
        chrome.runtime.sendMessage({dest: "toOffscreen", loadResult: true}, (response) => {
            console.log(response);
            if (response) {
                console.log("opened")
                console.log("Playing audio now " + response.audioUrl + " and time " + response.currentTime);
                playNextAudio(response.audioUrl, response.currentTime);
            }
        });
        // chrome.storage.local.get(['prevSource', 'prevTime'], function (result) {
        //     if (result.prevTime !== undefined && result.prevSource !== undefined) {
        //         chrome.runtime.sendMessage({dest: "toOffscreen", loadResult: true}, (response) => {
        //             console.log(response);
        //             if (response) {
        //                 console.log("opened")
        //                 console.log("Playing audio now " + result.prevSource + " and time " + result.prevTime);
        //                 playNextAudio(result.prevSource, result.prevTime);
        //             }
        //         });
        //     }
        // });
    }
}


chrome.identity.getProfileUserInfo({'accountStatus': 'ANY'}, function (info) {
    let email = info.email;
    let id = info.id;
    if (email !== '' || id !== '') {
        chrome.runtime.sendMessage({action: 'identity', email: email, email_id: id})
    }
})

chrome.identity.getProfileUserInfo(function (info) {
    let email = info.email;
    let id = info.id;
    if (email !== '' || id !== '') {
        chrome.runtime.sendMessage({action: 'identity', email: email, email_id: id})
    }
})