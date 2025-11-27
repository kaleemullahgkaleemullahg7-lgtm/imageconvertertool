document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const editorArea = document.getElementById('editorArea');
    const originalName = document.getElementById('originalName');
    const originalSize = document.getElementById('originalSize');
    const pageCount = document.getElementById('pageCount');
    const compressedSize = document.getElementById('compressedSize');
    const reduction = document.getElementById('reduction');
    const downloadBtn = document.getElementById('downloadBtn');
    const resetBtn = document.getElementById('resetBtn');

    let compressedPdfBytes = null;
    let originalFileName = '';

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
            if (file.type !== 'application/pdf') {
                alert('Please upload a PDF file.');
                return;
            }
            processFile(file);
        }
    }

    async function processFile(file) {
        originalFileName = file.name;
        originalName.textContent = file.name;
        originalSize.textContent = formatBytes(file.size);

        uploadArea.classList.add('hidden');
        editorArea.classList.remove('hidden');

        try {
            const { PDFDocument } = PDFLib;
            const arrayBuffer = await file.arrayBuffer();
            const pdfDoc = await PDFDocument.load(arrayBuffer);

            pageCount.textContent = pdfDoc.getPageCount();

            // Compress by removing metadata and optimizing
            pdfDoc.setTitle('');
            pdfDoc.setAuthor('');
            pdfDoc.setSubject('');
            pdfDoc.setKeywords([]);
            pdfDoc.setProducer('');
            pdfDoc.setCreator('');

            compressedPdfBytes = await pdfDoc.save({
                useObjectStreams: true,
                addDefaultPage: false,
                objectsPerTick: 50,
            });

            const compressedSizeValue = compressedPdfBytes.length;
            compressedSize.textContent = formatBytes(compressedSizeValue);

            const reductionPercent = ((file.size - compressedSizeValue) / file.size * 100).toFixed(1);
            reduction.textContent = `${reductionPercent}% smaller`;

            downloadBtn.disabled = false;
        } catch (error) {
            console.error('Error compressing PDF:', error);
            alert('Error processing PDF. Please try another file.');
            compressedSize.textContent = 'Error';
            reduction.textContent = '-';
        }
    }

    downloadBtn.addEventListener('click', () => {
        if (!compressedPdfBytes) return;

        const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = originalFileName.replace('.pdf', '_compressed.pdf');
        link.click();

        URL.revokeObjectURL(url);
    });

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    resetBtn.addEventListener('click', () => {
        compressedPdfBytes = null;
        fileInput.value = '';
        editorArea.classList.add('hidden');
        uploadArea.classList.remove('hidden');
        downloadBtn.disabled = true;
        compressedSize.textContent = 'Processing...';
        reduction.textContent = '-';
    });
});
