function haveOverNoteLength(text, maxNoteLength) {
    if (!text) return false;
    return text.length > maxNoteLength;
}


function truncateText(text, maxNoteLength) {
    if (!text) return "";
    return text.length > maxNoteLength
        ? text.substring(0, maxNoteLength)
        : text;
} 

export { haveOverNoteLength, truncateText };