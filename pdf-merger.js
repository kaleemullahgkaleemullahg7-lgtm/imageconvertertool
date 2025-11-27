document.addEventListener('DOMContentLoaded', () => {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const editorArea = document.getElementById('editorArea');
    const pdfList = document.getElementById('pdfList');
    const mergeBtn = document.getElementById('mergeBtn');
    const resetBtn = document.getElementById('resetBtn');

    let pdfFiles = [];

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
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const validFiles = files.filter(file => file.type === 'application/pdf');
        if (validFiles.length === 0) {
            alert('Please upload PDF files only.');
            return;
        }

        pdfFiles = validFiles;
        displayPDFList();
        uploadArea.classList.add('hidden');
        editorArea.classList.remove('hidden');
    }

    function displayPDFList() {
        pdfList.innerHTML = '';
        pdfFiles.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'pdf-item glass-panel';
            item.innerHTML = `
                <div class="pdf-icon">📄</div>
                <div class="pdf-details">
                    <div class="pdf-name">${file.name}</div>
                    <div class="pdf-size">${formatBytes(file.size)}</div>
                </div>
                <button class="remove-btn" onclick="removePDF(${index})">✕</button>
            `;
            pdfList.appendChild(item);
        });
    }

    window.removePDF = function (index) {
        pdfFiles.splice(index, 1);
        if (pdfFiles.length === 0) {
            resetTool();
        } else {
            displayPDFList();
        }
    };

    mergeBtn.addEventListener('click', async () => {
        if (pdfFiles.length < 2) {
            alert('Please upload at least 2 PDF files to merge.');
            return;
        }

        mergeBtn.disabled = true;
        mergeBtn.textContent = 'Merging PDFs...';

        try {
            const { PDFDocument } = PDFLib;
            const mergedPdf = await PDFDocument.create();

            for (const file of pdfFiles) {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await PDFDocument.load(arrayBuffer);
                const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                copiedPages.forEach((page) => mergedPdf.addPage(page));
            }

            const mergedPdfBytes = await mergedPdf.save();
            const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = 'merged_document.pdf';
            link.click();

            URL.revokeObjectURL(url);
            mergeBtn.textContent = 'Merge & Download PDF';
            mergeBtn.disabled = false;
        } catch (error) {
            console.error('Error merging PDFs:', error);
            alert('Error merging PDFs. Please try again.');
            mergeBtn.textContent = 'Merge & Download PDF';
            mergeBtn.disabled = false;
        }
    });

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    function resetTool() {
        pdfFiles = [];
        fileInput.value = '';
        editorArea.classList.add('hidden');
        uploadArea.classList.remove('hidden');
    }

    resetBtn.addEventListener('click', resetTool);
});
