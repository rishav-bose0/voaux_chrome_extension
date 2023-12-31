import {handleTextSelection} from "./popup.js";
import {playNextAudio} from "./popup.js"
function onError(error) {
    console.log("Error: " + error);
}

async function fetchAndCreateImageBlocks() {
    try {
        let prevHighlightedBlock = 0;
        await chrome.storage.local.get(['highlightedBlock'], function(result) {
            if(result.highlightedBlock !== undefined){
                prevHighlightedBlock = result.highlightedBlock;
                console.log("Block is ", result.highlightedBlock);
            }
        });

        console.log("Calling")
        const response = await fetch('https://seashell-app-qf57f.ondigitalocean.app/api/v1/list_speaker_details_for_extension', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })
            .then(response => response.json())
            .then(data => {
                console.log("Response recived.")
                console.log(data)
                const imageBlocksContainer = document.getElementById('imageBlocksContainer');

                let currentAudio = null;
                let prevOpenRange = null;
                console.log("Again Block is ", prevHighlightedBlock);
                // Create image blocks for each item in the data response
                data.forEach((item, index) => {
                    const aiVoiceBlock = document.createElement('div');
                    aiVoiceBlock.classList.add('aiVoiceBlock');
                    // Set block content with gender and ID
                    const image = document.createElement('img');
                    image.src = item.Img_url;
                    image.style.width = '80px';
                    image.classList.add('circular-image');

                    if(index <5){
                        if(index===0){
                            image.src = 'img_files/test0.png';
                            // aiVoiceBlock.innerHTML = `<img src=img_files/test0.png style="width: 80px;">`;
                        }
                        if(index===1){
                            image.src = 'img_files/test1.png';
                            // aiVoiceBlock.innerHTML = `<img src=img_files/test1.png style="width: 80px;">`;
                        }
                        if(index===2){
                            image.src = 'img_files/test2.png';
                            // aiVoiceBlock.innerHTML = `<img src=img_files/test2.png style="width: 80px;">`;
                        }
                        if(index===3){
                            image.src = 'img_files/test3.png';
                            // aiVoiceBlock.innerHTML = `<img src=img_files/test3.png style="width: 80px;">`;
                        }
                        if(index===4){
                            image.src = 'img_files/test4.png';
                            // aiVoiceBlock.innerHTML = `<img src=img_files/test4.png style="width: 80px;">`;
                        }
                        if(index===5){
                            image.src = 'img_files/test5.png';
                            // aiVoiceBlock.innerHTML = `<img src=img_files/test5.png style="width: 80px;">`;
                        }

                    } else {
                        image.src = item.Img_url;
                        // aiVoiceBlock.innerHTML = `<img src=${item.Img_url} style="width: 80px;">`;
                    }
                    aiVoiceBlock.appendChild(image);

                    // const  aiDetailBlock = document.createElement('div');
                    // aiDetailBlock.classList.add('aiDetailBlock');
                    aiVoiceBlock.innerHTML += `<p style="font-weight: bold">${item.Name} (${item.Gender})</p>`;

                    // aiVoiceBlock.appendChild(aiDetailBlock)

                    const voiceBlock = document.createElement('div');
                    voiceBlock.className = "voiceBlock"

                    const playSampleButton = document.createElement('button');
                    playSampleButton.innerHTML = "Sample Voice";
                    playSampleButton.classList.add("Button")
                    // block.appendChild(playSampleButton);

                    const playTextButton = document.createElement('button');
                    playTextButton.innerHTML = "Play Text";
                    playTextButton.classList.add("Button")
                    voiceBlock.appendChild(playSampleButton)
                    voiceBlock.appendChild(playTextButton)
                    aiVoiceBlock.appendChild(voiceBlock)


                    const durationButton = document.createElement('button');
                    durationButton.innerHTML = `<img src=img_files/speed.png style="width: 20px; height: 20px">`;
                    durationButton.classList.add("Button2");

                    const rangeDiv = document.createElement('div');
                    rangeDiv.classList.add('range');

                    const rangeInput = document.createElement('input');
                    rangeInput.type = 'range';
                    rangeInput.value = '1';
                    rangeInput.min = '0';
                    rangeInput.max = '2';
                    rangeInput.step = '0.25';
                    // rangeInput.setAttribute('oninput', `updateRangeValue(this.value)`);
                    const rangeValue = document.createElement('p');
                    rangeValue.id = 'rangeValue';
                    rangeValue.innerText = 'Speed: 1x';
                    rangeInput.addEventListener('input', () => {
                        rangeValue.innerText = 'Speed: '+rangeInput.value+'x';
                        // updateRangeValue(rangeInput.value);
                    });
                    // Append elements to the range div
                    rangeDiv.appendChild(rangeInput);
                    rangeDiv.appendChild(rangeValue);


                    rangeDiv.style.display = "none";
                    durationButton.addEventListener('click', () => {
                        if (prevOpenRange && prevOpenRange !== rangeDiv) {
                            // console.log("inside 1st if");
                            prevOpenRange.style.display = "none";
                        }

                        // if (prevOpenRange !== rangeDiv) {
                            if (rangeDiv.style.display === "none") {
                                // console.log("inside 2nd if");
                                rangeDiv.style.display = "block"; // Show the slider
                                prevOpenRange = rangeDiv;
                            } else {
                                // console.log("inside else");
                                rangeDiv.style.display = "none"; // Hide the slider
                                // prevOpenRange.style.display = "none";
                            }
                        // }
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

                    if(prevHighlightedBlock === index){
                        console.log("yes here");
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
                        chrome.storage.local.set({ 'highlightedBlock': index });

                        const speakerId = item.Id;
                        const speechSpeed = 1/rangeInput.value;
                        handleTextSelection(speakerId, speechSpeed);
                    });

                    // durationButton.appendChild(rangeDiv);
                    aiVoiceBlock.appendChild(durationButton)
                    aiVoiceBlock.appendChild(rangeDiv)
                    // Append block to the container
                    imageBlocksContainer.appendChild(aiVoiceBlock);
                });
            })
            .catch(onError);

    } catch (error) {
        console.error('Error:', error);
    }
}

// Function to update the range value display
function updateRangeValue(value) {
    console.log("here" + value)
    rangeValue.innerText = value;
}

// Call fetchAndCreateImageBlocks when the popup is opened
document.addEventListener('DOMContentLoaded', function () {
    console.log("opened");
    fetchAndCreateImageBlocks(); // Load image blocks on page load
    createPreviewAudioBlock();
});

function createPreviewAudioBlock () {
    if(chrome.offscreen.hasDocument()){
        console.log("yes");
        chrome.storage.local.get(['prevSource', 'prevTime'], function(result) {
            if(result.prevTime !== undefined && result.prevSource !== undefined){

                const selectedTextElement = document.getElementById('fixedAudioBlock');
                playNextAudio(result.prevSource, result.prevTime);
            }
        });
    }
}