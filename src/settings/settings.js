const { getStoreValue, setStoreValues, getSources, setSettings } = window.API;

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
let selectedLayout = null;
let sources = null;

function debounce(func, time = 100) {
    let timer;
    return (event) => {
        if (timer) {
            clearTimeout(timer);
        }
        timer = setTimeout(func, time, event);
    };
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

function renderSourceOptions(sources, selected = null) {
    iScreen.innerHTML = '';
    sources.forEach((s) => {
        const option = document.createElement('option');
        option.value = s.id;
        option.text = s.name;
        if (selected && selected.id === s.id) {
            option.selected = true;
        }
        iScreen.appendChild(option);
    });
}

function updateActiveLayoutClass(layout) {
    bLayoutFull.classList.remove('active');
    bLayoutLeft.classList.remove('active');
    bLayoutCenter.classList.remove('active');
    bLayoutRight.classList.remove('active');

    if (layout === LAYOUT_FULL) {
        bLayoutFull.classList.add('active');
    } else if (layout === LAYOUT_LEFT) {
        bLayoutLeft.classList.add('active');
    } else if (layout === LAYOUT_CENTER) {
        bLayoutCenter.classList.add('active');
    } else if (layout === LAYOUT_RIGHT) {
        bLayoutRight.classList.add('active');
    }
}

function updateVideoElement(source, layout) {
    if (!source || !layout) {
        return;
    }

    const d = source.displayBounds.height / source.displayBounds.width;
    const h = d * dVideo.offsetWidth;
    dVideo.style.marginBottom = '-' + Math.round(dVideo.offsetHeight - h) + 'px';
    console.log(d);
    console.log(h);

    if (layout === LAYOUT_FULL) {
        dVideoLeft.style.width = '0';
        dVideoCenter.style.width = '100%';
        dVideoCenter.style.left = '0';
        dVideoRight.style.width = '0';
    } else {
        dVideoCenter.style.width = '50%';

        if (layout === LAYOUT_LEFT) {
            dVideoLeft.style.width = '0';
            dVideoRight.style.width = '50%';
            dVideoCenter.style.left = '0';
        } else if (layout === LAYOUT_CENTER) {
            dVideoLeft.style.width = '25%';
            dVideoRight.style.width = '25%';
            dVideoCenter.style.left = '25%';
        } else if (layout === LAYOUT_RIGHT) {
            dVideoLeft.style.width = '50%';
            dVideoRight.style.width = '0';
            dVideoCenter.style.left = '50%';
        }
    }
}

function getSourceBounds(source, layout) {
    const b = source.displayBounds;
    switch (layout) {
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

async function dataChanged(source, layout) {
    if (!source) {
        return;
    }
    layout = layout || LAYOUT_FULL;

    const settings = {
        sourceId: source.id,
        displayBounds: { ...source.displayBounds },
        sourceBounds: getSourceBounds(source, layout),
    };

    if (selectedLayout !== layout) {
        updateActiveLayoutClass(layout);
    }

    try {
        if (!selectedSource || selectedSource.id !== source.id) {
            const stream = await getStream(settings.sourceId);
            if (!stream) {
                throw new Error('No video stream available');
            }
            dVideo.srcObject = stream;
            dVideo.onloadedmetadata = () => {
                video.play().then(() => {
                    updateVideoElement(source, layout);
                });
            };
        } else {
            updateVideoElement(source, layout);
        }
    } catch (e) {
        log.error(e);
    }

    selectedSource = source;
    selectedLayout = layout;
    setSettings(settings);
}

async function init() {
    const [savedSource, savedLayout, currentSources] = await Promise.all([
        getStoreValue('source'),
        getStoreValue('layout'),
        getSources(),
    ]);
    sources = currentSources;

    if (!sources.length) {
        renderSourceOptions({ id: '', name: 'No sources found' });
        return;
    }

    const layout = (savedLayout && [LAYOUT_FULL, LAYOUT_LEFT, LAYOUT_CENTER, LAYOUT_RIGHT].indexOf(savedLayout) !== -1)
        ? savedLayout
        : LAYOUT_FULL;
    const source = (savedSource && sources.find(s => s.id === savedSource)) || sources[0];

    renderSourceOptions(sources, source);
    dataChanged(source, layout);

    setStoreValues({
        source: source.id,
        layout,
    });
}

function layoutSelected(layout) {
    if (layout) {
        dataChanged(selectedSource, layout);
        setStoreValues({ layout });
    }
}

function sourceSelectChanged() {
    const sourceId = iScreen.value;
    if (!sourceId || !sources) {
        return;
    }
    const source = sources.find(s => s.id === sourceId);
    if (source) {
        dataChanged(source, selectedLayout);
        setStoreValues({ source: source.id });
    }
}

// EVENTS
iScreen.addEventListener('change', sourceSelectChanged);
bLayoutFull.addEventListener('click', () => layoutSelected(LAYOUT_FULL));
bLayoutLeft.addEventListener('click', () => layoutSelected(LAYOUT_LEFT));
bLayoutCenter.addEventListener('click', () => layoutSelected(LAYOUT_CENTER));
bLayoutRight.addEventListener('click', () => layoutSelected(LAYOUT_RIGHT));
document.addEventListener('DOMContentLoaded', init, false);
window.addEventListener('resize', debounce(() => updateVideoElement(selectedSource, selectedLayout), 500));
