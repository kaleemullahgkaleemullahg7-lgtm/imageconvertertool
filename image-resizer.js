document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const editorArea = document.getElementById('editorArea');
    const originalPreview = document.getElementById('originalPreview');
    const resizedPreview = document.getElementById('resizedPreview');
    const originalInfo = document.getElementById('originalInfo');
    const resizedInfo = document.getElementById('resizedInfo');
    const widthInput = document.getElementById('widthInput');
    const heightInput = document.getElementById('heightInput');
    const aspectRatio = document.getElementById('aspectRatio');
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');

    let currentFile = null;
    let originalImage = new Image();
    let originalAspectRatio = 1;

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
            originalImage.src = reader.result;
            originalImage.onload = function () {
                originalPreview.src = originalImage.src;
                originalInfo.textContent = `${originalImage.width}x${originalImage.height} • ${formatBytes(file.size)}`;
                originalAspectRatio = originalImage.width / originalImage.height;

                widthInput.value = originalImage.width;
                heightInput.value = originalImage.height;

                uploadArea.classList.add('hidden');
                editorArea.classList.remove('hidden');

                resizeImage();
            }
        }
    }

    // Handle aspect ratio lock
    widthInput.addEventListener('input', () => {
        if (aspectRatio.checked && widthInput.value) {
            heightInput.value = Math.round(widthInput.value / originalAspectRatio);
        }
        resizeImage();
    });

    heightInput.addEventListener('input', () => {
        if (aspectRatio.checked && heightInput.value) {
            widthInput.value = Math.round(heightInput.value * originalAspectRatio);
        }
        resizeImage();
    });

    function resizeImage() {
        if (!originalImage.src) return;

        const width = parseInt(widthInput.value) || originalImage.width;
        const height = parseInt(heightInput.value) || originalImage.height;

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(originalImage, 0, 0, width, height);

        const dataUrl = canvas.toDataURL(currentFile.type, 0.95);
        resizedPreview.src = dataUrl;

        const head = 'data:' + currentFile.type + ';base64,';
        const size = Math.round((dataUrl.length - head.length) * 3 / 4);
        resizedInfo.textContent = `${width}x${height} • ${formatBytes(size)}`;

        downloadBtn.onclick = () => {
            const link = document.createElement('a');
            const ext = currentFile.type.split('/')[1];
            const originalName = currentFile.name.split('.')[0];
            link.download = `${originalName}_resized.${ext}`;
            link.href = dataUrl;
            link.click();
        };
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    resetBtn.addEventListener('click', () => {
        currentFile = null;
        fileInput.value = '';
        editorArea.classList.add('hidden');
        uploadArea.classList.remove('hidden');
        widthInput.value = '';
        heightInput.value = '';
    });
});
