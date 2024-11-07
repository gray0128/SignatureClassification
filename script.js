function processFile() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];

    if (!file) {
        alert('请选择一个文件');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        const range = XLSX.utils.decode_range(worksheet['!ref']);
        for (let R = range.s.r; R <= range.e.r; ++R) {
            const cellAddress = {c: 0, r: R};
            const cellRef = XLSX.utils.encode_cell(cellAddress);
            const cell = worksheet[cellRef];

            if (cell && cell.v) {
                const value = cell.v.toString();
                let result = '其他';

                // 增加对零宽连接符和零宽非连接符的处理
                if (/^\d+$/.test(value)) {
                    result = '数字';
                } else if (/^[A-Za-z]+$/.test(value)) {
                    result = '字母';
                } else if (/^[A-Za-z\d]+$/.test(value)) {
                    result = '数字+字母';
                } else if (/[&·|｜：:\u200D\u200C]/.test(value)) {
                    result = '符号';
                }

                console.log(`Row ${R + 1}, Column 1: ${value} -> Row ${R + 1}, Column 2: ${result}`);

                const resultCellAddress = {c: 1, r: R};
                const resultCellRef = XLSX.utils.encode_cell(resultCellAddress);
                worksheet[resultCellRef] = {t: 's', v: result};
            }
        }

        // 确保更新范围
        worksheet['!ref'] = XLSX.utils.encode_range({s: {c: 0, r: 0}, e: {c: 1, r: range.e.r}});

        const processedFileName = file.name.replace(/\.xlsx$/, '') + '已处理.xlsx';
        const processedWorkbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(processedWorkbook, worksheet, sheetName);
        const processedData = XLSX.write(processedWorkbook, {bookType: 'xlsx', type: 'array'});

        const blob = new Blob([processedData], {type: 'application/octet-stream'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = processedFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    reader.readAsArrayBuffer(file);
}
