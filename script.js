document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const editorArea = document.getElementById('editorArea');
    const originalPreview = document.getElementById('originalPreview');
    const compressedPreview = document.getElementById('compressedPreview');
    const originalInfo = document.getElementById('originalInfo');
    const compressedInfo = document.getElementById('compressedInfo');
    const qualitySlider = document.getElementById('qualitySlider');
    const qualityValue = document.getElementById('qualityValue');
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');

    // New Controls
    const formatSelect = document.getElementById('formatSelect');
    const maxWidthInput = document.getElementById('maxWidth');
    const maxHeightInput = document.getElementById('maxHeight');

    let currentFile = null;
    let originalImage = new Image();

    // Drag & Drop Events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        uploadArea.classList.add('drag-over');
    }

    function unhighlight() {
        uploadArea.classList.remove('drag-over');
    }

    uploadArea.addEventListener('drop', handleDrop, false);
    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFiles);

    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        handleFiles({ target: { files: files } });
    }

    function handleFiles(e) {
        const files = e.target.files;
        if (files.length > 0) {
            const file = files[0];
            if (!file.type.match('image.*')) {
                alert('Please upload an image file (PNG, JPG, WEBP).');
                return;
            }
            currentFile = file;
            processFile(file);
        }
    }

    function processFile(file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = function () {
            originalImage.src = reader.result;
            originalImage.onload = function () {
                // Display original
                originalPreview.src = originalImage.src;
                originalInfo.textContent = `${originalImage.width}x${originalImage.height} • ${formatBytes(file.size)}`;

                // Set initial inputs
                maxWidthInput.value = '';
                maxHeightInput.value = '';
                formatSelect.value = 'original';

                // Show editor, hide upload
                uploadArea.classList.add('hidden');
                editorArea.classList.remove('hidden');

                // Initial compression
                compressImage();
            }
        }
    }

    // Compression Logic
    qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = `${e.target.value}%`;
        compressImage();
    });

    // Add listeners for new controls
    [formatSelect, maxWidthInput, maxHeightInput].forEach(el => {
        el.addEventListener('input', compressImage);
    });

    function compressImage() {
        if (!currentFile || !originalImage) return;

        const quality = parseInt(qualitySlider.value) / 100;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Calculate Dimensions
        let width = originalImage.width;
        let height = originalImage.height;
        const maxWidth = parseInt(maxWidthInput.value);
        const maxHeight = parseInt(maxHeightInput.value);

        if (maxWidth && maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
        } else if (maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height *= ratio;
        } else if (maxHeight) {
            const ratio = maxHeight / height;
            height = maxHeight;
            width *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(originalImage, 0, 0, width, height);

        // Determine output format
        let mimeType = currentFile.type;
        if (formatSelect.value !== 'original') {
            mimeType = formatSelect.value;
        }

        // Handle PNG quality edge case (convert to JPEG/WEBP if quality < 1 and PNG selected/original)
        // Note: Standard canvas toDataURL for PNG ignores quality. 
        // If user explicitly wants PNG, we give PNG (lossless).
        // If user wants compression on a PNG, they should ideally switch format, 
        // but we can't force it unless we change the logic to default to JPEG for compression.
        // For this tool, we will respect the format selection.

        const dataUrl = canvas.toDataURL(mimeType, quality);

        compressedPreview.src = dataUrl;

        // Calculate size
        const head = 'data:' + mimeType + ';base64,';
        const size = Math.round((dataUrl.length - head.length) * 3 / 4);
        compressedInfo.textContent = `${Math.round(width)}x${Math.round(height)} • ${formatBytes(size)}`;

        // Update download button
        downloadBtn.onclick = () => {
            const link = document.createElement('a');
            const ext = mimeType.split('/')[1];
            const originalName = currentFile.name.split('.')[0];
            link.download = `${originalName}_compressed.${ext}`;
            link.href = dataUrl;
            link.click();
        };
    }

    // Utilities
    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Reset
    resetBtn.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = '';
        editorArea.classList.add('hidden');
        uploadArea.classList.remove('hidden');
        qualitySlider.value = 80;
        qualityValue.textContent = '80%';
        maxWidthInput.value = '';
        maxHeightInput.value = '';
        formatSelect.value = 'original';
    });
});
