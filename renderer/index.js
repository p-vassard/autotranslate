document.addEventListener('DOMContentLoaded', async () => {
    const translateBtn = document.getElementById('translateBtn');
    const resultText = document.getElementById('resultText');
    const loader = document.getElementById('loader');

    // Check if we have a saved zone to enable button initially
    const hasZone = await window.api.hasSavedZone();
    if (hasZone) {
        translateBtn.disabled = false;
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

    // Enable button when zone is selected
    window.api.onZoneReady(() => {
        translateBtn.disabled = false;
        translateBtn.textContent = "Traduire la sélection";
    });

    // Custom modal implementation
    const promptModal = document.getElementById('promptModal');
    const promptInput = document.getElementById('promptInput');
    const savePromptBtn = document.getElementById('savePromptBtn');
    const cancelPromptBtn = document.getElementById('cancelPromptBtn');

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
        loader.classList.remove('hidden');
        resultText.textContent = '';
    });

    translateBtn.addEventListener('click', async () => {
        loader.classList.remove('hidden');
        resultText.textContent = '';
        translateBtn.disabled = true;

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
            // Keep it disabled until a new zone is selected, or keep it enabled for re-translating the same zone?
            // Let's keep it enabled so user can retry or re-translate.
            translateBtn.disabled = false;
        }
    });
});
