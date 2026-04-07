document.addEventListener('DOMContentLoaded', async () => {
    const translateBtn = document.getElementById('translateBtn');
    const storeBtn = document.getElementById('storeBtn');
    const sendBtn = document.getElementById('sendBtn');
    const resultText = document.getElementById('resultText');
    const loader = document.getElementById('loader');
    const storedPanel = document.getElementById('storedPanel');
    const storedImages = document.getElementById('storedImages');
    const clearStoredBtn = document.getElementById('clearStoredBtn');

    // In-memory store of captured base64 images
    let storedBase64Images = [];

    // Check if we have a saved zone to enable buttons initially
    const hasZone = await window.api.hasSavedZone();
    if (hasZone) {
        translateBtn.disabled = false;
        storeBtn.disabled = false;
    }

    // Fetch and apply saved font size
    const fontSize = await window.api.getFontSize();
    resultText.style.fontSize = `${fontSize}px`;

    // Listen to font size changes from main menu
    window.api.onUpdateFontSize((size) => {
        resultText.style.fontSize = `${size}px`;
    });

    // Fetch and display old translation
    const lastTrans = await window.api.getLastTranslation();
    if (lastTrans) {
        resultText.innerHTML = lastTrans;
    }

    // Enable buttons when zone is selected
    window.api.onZoneReady(() => {
        translateBtn.disabled = false;
        storeBtn.disabled = false;
        translateBtn.textContent = "Traduire";
    });

    // ── Prompt modal ──
    const promptModal = document.getElementById('promptModal');
    const promptInput = document.getElementById('promptInput');
    const savePromptBtn = document.getElementById('savePromptBtn');
    const cancelPromptBtn = document.getElementById('cancelPromptBtn');

    window.api.getPromptSize().then(size => {
        if (size && size.width && size.height) {
            promptInput.style.width = size.width;
            promptInput.style.height = size.height;
        }
    });

    promptInput.addEventListener('mouseup', () => {
        window.api.savePromptSize({
            width: promptInput.style.width,
            height: promptInput.style.height
        });
    });

    window.api.onAskForPrompt((currentPrompt) => {
        promptInput.value = currentPrompt;
        promptModal.classList.remove('hidden');
        promptInput.focus();
    });

    savePromptBtn.addEventListener('click', () => {
        const newPrompt = promptInput.value.trim();
        if (newPrompt) {
            window.api.savePrompt(newPrompt);
        }
        promptModal.classList.add('hidden');
    });

    cancelPromptBtn.addEventListener('click', () => {
        promptModal.classList.add('hidden');
    });

    window.api.onTranslationStarted(() => {
        translateBtn.disabled = true;
        storeBtn.disabled = true;
        sendBtn.disabled = true;
        loader.classList.remove('hidden');
        resultText.textContent = '';
    });

    // ── Helper: update stored panel visibility and send button ──
    function updateStoredUI() {
        if (storedBase64Images.length > 0) {
            storedPanel.classList.remove('hidden');
            sendBtn.disabled = false;
        } else {
            storedPanel.classList.add('hidden');
            sendBtn.disabled = true;
        }
    }

    // ── Helper: add an image thumbnail to the stored panel ──
    function addStoredImageThumbnail(base64, index) {
        const item = document.createElement('div');
        item.className = 'stored-image-item';
        item.dataset.index = index;

        const img = document.createElement('img');
        img.src = `data:image/jpeg;base64,${base64}`;
        img.alt = `Capture ${index + 1}`;

        const removeBtn = document.createElement('button');
        removeBtn.className = 'stored-image-remove';
        removeBtn.textContent = '✕';
        removeBtn.addEventListener('click', () => {
            const idx = parseInt(item.dataset.index);
            storedBase64Images.splice(idx, 1);
            rebuildStoredThumbnails();
            updateStoredUI();
        });

        item.appendChild(img);
        item.appendChild(removeBtn);
        storedImages.appendChild(item);
    }

    // ── Rebuild all thumbnails (after removal) ──
    function rebuildStoredThumbnails() {
        storedImages.innerHTML = '';
        storedBase64Images.forEach((b64, i) => addStoredImageThumbnail(b64, i));
    }

    // ── Clear all stored images ──
    clearStoredBtn.addEventListener('click', () => {
        storedBase64Images = [];
        storedImages.innerHTML = '';
        updateStoredUI();
    });

    // ── "Traduire" button: immediate translate (existing behavior) ──
    translateBtn.addEventListener('click', async () => {
        loader.classList.remove('hidden');
        resultText.textContent = '';
        translateBtn.disabled = true;
        storeBtn.disabled = true;

        try {
            const result = await window.api.translate();
            loader.classList.add('hidden');

            if (result.success) {
                resultText.innerHTML = result.text;
            } else {
                resultText.textContent = "Erreur: " + result.error;
            }
        } catch (err) {
            loader.classList.add('hidden');
            resultText.textContent = "Une erreur est survenue.";
        } finally {
            translateBtn.disabled = false;
            storeBtn.disabled = false;
        }
    });

    // ── "Stocker" button: capture and store without translating ──
    storeBtn.addEventListener('click', async () => {
        storeBtn.disabled = true;
        try {
            const result = await window.api.captureZone();
            if (result.success) {
                storedBase64Images.push(result.base64);
                addStoredImageThumbnail(result.base64, storedBase64Images.length - 1);
                updateStoredUI();
            } else {
                resultText.textContent = "Erreur capture: " + result.error;
            }
        } catch (err) {
            resultText.textContent = "Erreur lors de la capture.";
        } finally {
            storeBtn.disabled = false;
        }
    });

    // ── "Envoyer" button: send all stored images for translation ──
    sendBtn.addEventListener('click', async () => {
        if (storedBase64Images.length === 0) return;

        loader.classList.remove('hidden');
        resultText.textContent = '';
        translateBtn.disabled = true;
        storeBtn.disabled = true;
        sendBtn.disabled = true;

        try {
            const result = await window.api.translateMultiple(storedBase64Images);
            loader.classList.add('hidden');

            if (result.success) {
                resultText.innerHTML = result.text;
                // Clear stored images after successful send
                storedBase64Images = [];
                storedImages.innerHTML = '';
                updateStoredUI();
            } else {
                resultText.textContent = "Erreur: " + result.error;
            }
        } catch (err) {
            loader.classList.add('hidden');
            resultText.textContent = "Une erreur est survenue.";
        } finally {
            translateBtn.disabled = false;
            storeBtn.disabled = false;
            // sendBtn state will be updated by updateStoredUI
            updateStoredUI();
        }
    });
});
