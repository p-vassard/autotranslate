const { desktopCapturer, nativeImage } = require('electron');

async function captureScreenZone(bounds) {
    // We need to capture the entire screen and crop it
    const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 0, height: 0 } });

    // A robust capture in Electron nowadays often requires a hidden window to capture specifically.
    // Wait, desktopCapturer.getSources only returns thumbnails. If we want full res, we need to specify a large thumbnail size
    // like the screen size, but the standard way in modern Electron (due to security) is to use `webContents.capturePage()` 
    // or use `navigator.mediaDevices.getDisplayMedia` in a renderer.
    // Because capturing in main process via getSources is deprecated for full screen and can eat memory.
    // However, for this demo, getting a large thumbnail from getSources might be the easiest purely in main.js. Let's try that.

    // Let's get primary display size to set thumbnailSize
    const { screen } = require('electron');
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.size;
    const scaleFactor = primaryDisplay.scaleFactor; // handle high DPI

    const sourcesWithThumbs = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: width * scaleFactor, height: height * scaleFactor }
    });

    const primarySource = sourcesWithThumbs[0]; // simplistic assumption
    const fullImage = primarySource.thumbnail; // This is a NativeImage

    // Crop the image
    // Scale bounds according to scaleFactor
    const cropRect = {
        x: Math.round(bounds.x * scaleFactor),
        y: Math.round(bounds.y * scaleFactor),
        width: Math.round(bounds.width * scaleFactor),
        height: Math.round(bounds.height * scaleFactor)
    };

    const croppedImage = fullImage.crop(cropRect);

    // Transform to base64
    return croppedImage.toJPEG(90).toString('base64');
}

module.exports = { captureScreenZone };
