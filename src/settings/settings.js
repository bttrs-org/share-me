const { setSettings, getSources } = window.API;

const LAYOUT_FULL = 'F';
const LAYOUT_LEFT = 'L';
const LAYOUT_CENTER = 'C';
const LAYOUT_RIGHT = 'R';

const dVideo = document.getElementById('video');
const dVideoLeft = document.getElementById('videoLeft');
const dVideoCenter = document.getElementById('videoCenter');
const dVideoRight = document.getElementById('videoRight');
const iScreen = document.getElementById('iScreen');
const bLayoutFull = document.getElementById('bLayoutFull');
const bLayoutLeft = document.getElementById('bLayoutLeft');
const bLayoutCenter = document.getElementById('bLayoutCenter');
const bLayoutRight = document.getElementById('bLayoutRight');
let selectedSource = null;
let selectedLayout = LAYOUT_FULL;
let sources = null;

function selectLayout(layout) {
    if (layout !== selectedLayout) {
        selectedLayout = layout;
        dataChanged();
    }
}

function selectSource() {
    const sourceId = iScreen.value;
    if (!sourceId || !sources) {
        return;
    }
    if (!selectedSource || (sourceId !== selectedSource.id)) {
        selectedSource = sources.find(s => s.id === sourceId);
        dataChanged();
    }
}

function createSourceOptions(sources) {
    iScreen.innerHTML = '';
    sources.forEach((s) => {
        const option = document.createElement('option');
        option.value = s.id;
        option.text = s.name;
        iScreen.appendChild(option);
    });
}

async function getStream(sourceId) {
    const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
            mandatory: {
                chromeMediaSource: 'desktop',
                chromeMediaSourceId: sourceId,
            },
        },
    });

    if (!stream || !stream.getVideoTracks().length) {
        return null;
    }

    return stream;
}

function updateVideoElement() {
    const d = selectedSource.displayBounds.height / selectedSource.displayBounds.width;
    const h = d * dVideo.offsetWidth;
    dVideo.style.marginBottom = '-' + Math.round(dVideo.offsetHeight - h) + 'px';

    if (selectedLayout === LAYOUT_FULL) {
        dVideoLeft.style.width = '0';
        dVideoCenter.style.width = '100%';
        dVideoCenter.style.left = '0';
        dVideoRight.style.width = '0';
    } else {
        dVideoCenter.style.width = '50%';

        if (selectedLayout === LAYOUT_LEFT) {
            dVideoLeft.style.width = '0';
            dVideoRight.style.width = '50%';
            dVideoCenter.style.left = '0';
        } else if (selectedLayout === LAYOUT_CENTER) {
            dVideoLeft.style.width = '25%';
            dVideoRight.style.width = '25%';
            dVideoCenter.style.left = '25%';
        } else if (selectedLayout === LAYOUT_RIGHT) {
            dVideoLeft.style.width = '50%';
            dVideoRight.style.width = '0';
            dVideoCenter.style.left = '50%';
        }
    }
}

function updateActiveLayoutClass() {
    bLayoutFull.classList.remove('active');
    bLayoutLeft.classList.remove('active');
    bLayoutCenter.classList.remove('active');
    bLayoutRight.classList.remove('active');

    if (selectedLayout === LAYOUT_FULL) {
        bLayoutFull.classList.add('active');
    } else if (selectedLayout === LAYOUT_LEFT) {
        bLayoutLeft.classList.add('active');
    } else if (selectedLayout === LAYOUT_CENTER) {
        bLayoutCenter.classList.add('active');
    } else if (selectedLayout === LAYOUT_RIGHT) {
        bLayoutRight.classList.add('active');
    }
}

function getSourceBounds() {
    const b = selectedSource.displayBounds;
    switch (selectedLayout) {
        case LAYOUT_FULL:
            return { x: 0, y: 0, width: b.width, height: b.height };
        case LAYOUT_LEFT:
            return { x: 0, y: 0, width: b.width / 2, height: b.height };
        case LAYOUT_CENTER:
            return { x: b.width / 4, y: 0, width: b.width / 2, height: b.height };
        case LAYOUT_RIGHT:
            return { x: b.width / 2, y: 0, width: b.width / 2, height: b.height };
    }
}

async function dataChanged() {
    if (!selectedSource) {
        return;
    }
    selectedLayout = selectedLayout || LAYOUT_FULL;

    const settings = {
        sourceId: selectedSource.id,
        displayBounds: { ...selectedSource.displayBounds },
        sourceBounds: getSourceBounds(),
    };

    updateActiveLayoutClass();

    try {
        const stream = await getStream(settings.sourceId);
        if (!stream) {
            throw new Error('No videos stream available');
        }

        dVideo.srcObject = stream;
        dVideo.onloadedmetadata = () => {
            updateVideoElement();
            video.play();
        };
    } catch (e) {
        log.error(e);
    }

    setSettings(settings);
}

async function init() {
    sources = await getSources(400);
    selectedSource = sources[0];
    createSourceOptions(sources);
    dataChanged();
}

function debounce(func, time = 100) {
    let timer;
    return (event) => {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(func, time, event);
    };
}

// EVENTS
iScreen.addEventListener('change', () => selectSource());
bLayoutFull.addEventListener('click', () => selectLayout(LAYOUT_FULL));
bLayoutLeft.addEventListener('click', () => selectLayout(LAYOUT_LEFT));
bLayoutCenter.addEventListener('click', () => selectLayout(LAYOUT_CENTER));
bLayoutRight.addEventListener('click', () => selectLayout(LAYOUT_RIGHT));
document.addEventListener('DOMContentLoaded', init, false);
window.addEventListener('resize', debounce(updateVideoElement, 500));