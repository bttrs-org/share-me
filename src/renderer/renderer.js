const { onSetSettings } = window.API;

const video = document.getElementById('video');
let selectedSource = null;

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

    if (!stream) {
        return null;
    }

    if (!stream.getVideoTracks().length) {
        return null;
    }

    return stream;
}

async function setSettings(settings) {
    const { x, y, sourceId } = settings;

    video.style.left = `-${x}px`;
    video.style.top = `-${y}px`;

    if (sourceId !== selectedSource) {
        selectedSource = sourceId;

        try {
            const stream = await getStream(sourceId);
            if (!stream) {
                throw new Error('No stream');
            }
            const { width: videoWidth, height: videoHeight } = stream.getVideoTracks()[0].getSettings();

            video.style.width = `${videoWidth}px`;
            video.style.height = `${videoHeight}px`;
            video.srcObject = stream;
            video.onloadedmetadata = () => video.play();
        } catch (e) {
            selectedSource = null;
            log.error(e);
        }
    }
}

onSetSettings((evt, settings) => setSettings(settings));

window.addEventListener('keydown', (evt) => {
    if (evt.key === 'Escape') {
        window.close();
    }
});
