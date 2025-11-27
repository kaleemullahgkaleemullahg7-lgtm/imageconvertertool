document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const editorArea = document.getElementById('editorArea');
    const imagePreview = document.getElementById('imagePreview');
    const fileInfo = document.getElementById('fileInfo');
    const formatSelect = document.getElementById('formatSelect');
    const convertBtn = document.getElementById('convertBtn');
    const resetBtn = document.getElementById('resetBtn');

    let currentFile = null;
    let currentImage = new Image();

    // Drag & Drop Events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.add('drag-over'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('drag-over'), false);
    });

    uploadArea.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        handleFiles({ target: { files: files } });
    }, false);

    uploadArea.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFiles);

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
            currentImage.src = reader.result;
            currentImage.onload = function () {
                imagePreview.src = currentImage.src;
                fileInfo.textContent = `${currentImage.width}x${currentImage.height} • ${formatBytes(file.size)} • ${file.type.split('/')[1].toUpperCase()}`;

                uploadArea.classList.add('hidden');
                editorArea.classList.remove('hidden');
            }
        }
    }

    // Convert and Download
    convertBtn.addEventListener('click', () => {
        if (!currentFile || !currentImage) return;

        const targetFormat = formatSelect.value;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = currentImage.width;
        canvas.height = currentImage.height;
        ctx.drawImage(currentImage, 0, 0);

        const quality = targetFormat === 'image/png' ? 1 : 0.95;
        const dataUrl = canvas.toDataURL(targetFormat, quality);

        const link = document.createElement('a');
        const ext = targetFormat.split('/')[1];
        const originalName = currentFile.name.split('.')[0];
        link.download = `${originalName}_converted.${ext}`;
        link.href = dataUrl;
        link.click();
    });

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
    });
});
