function tableWidth(tableHeader) {
    let width = 0;
    tableHeader.forEach((header) => {
        if (header.width) {
          width += parseInt(header.width.replace('px', ''));
        } else {
          width += 100;
        }
    });
    // console.warn('Calculated table width:', width + 20 + 'px');
    return width + 20 + 'px'; // Adding 20px for padding
}

export { tableWidth };