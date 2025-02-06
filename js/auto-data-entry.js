// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
  const processPdfButton = document.getElementById("processPdfButton");
  const pdfUpload = document.getElementById("pdfUpload");
  const autoDataStatus = document.getElementById("autoDataStatus");

  processPdfButton.addEventListener("click", () => {
    if (pdfUpload.files.length === 0) {
      autoDataStatus.innerText = "Please upload a PDF file.";
      return;
    }
    
    const file = pdfUpload.files[0];
    const fileReader = new FileReader();

    fileReader.onload = async function () {
      const typedarray = new Uint8Array(this.result);
      // Use PDF.js to read the document
      pdfjsLib.getDocument(typedarray).promise.then(async (pdf) => {
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => item.str).join(' ');
          fullText += pageText + "\n";
        }
        // Translate the text from Hindi to English.
        // (Replace this with your choice of translation AI/API in production.)
        const translatedText = await translateText(fullText, 'hi', 'en');
        // Extract data from the translated text (customize the regex/logic as needed)
        const extractedData = extractDataFromText(translatedText);
        // Populate the form fields with the extracted data.
        if (extractedData.lawFirm) {
          document.getElementById("lawFirm").value = extractedData.lawFirm;
        }
        if (extractedData.refNo) {
          document.getElementById("refNo").value = extractedData.refNo;
        }
        // (Add additional fields as required, e.g., area details, etc.)

        autoDataStatus.innerText = "Data extracted and form populated successfully.";
      }).catch((err) => {
        console.error(err);
        autoDataStatus.innerText = "Error reading PDF file.";
      });
    };

    fileReader.readAsArrayBuffer(file);
  });
});

// Example translation function (using a free API – for demo purposes only)
async function translateText(text, sourceLang, targetLang) {
  const encodedText = encodeURIComponent(text);
  // Using MyMemory Translated API (free API, but has rate limits)
  const url = `https://api.mymemory.translated.net/get?q=${encodedText}&langpair=${sourceLang}|${targetLang}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    // Return translated text from the response
    return data.responseData.translatedText;
  } catch (err) {
    console.error("Translation error:", err);
    return text; // Fallback to original text if translation fails
  }
}

// Example extraction function to simulate data parsing.
// Customize the logic (or use an AI language model API) to extract the necessary information.
function extractDataFromText(text) {
  const data = {};
  // Sample logic: extract the law firm (if present in format "Law Firm: XYZ")
  const lawFirmMatch = text.match(/Law\s*Firm\s*:\s*([A-Za-z0-9\s]+)/i);
  if (lawFirmMatch && lawFirmMatch[1]) {
    data.lawFirm = lawFirmMatch[1].trim();
  }
  // Sample logic: extract a reference number (if present in format "Reference Number: ABC123")
  const refNoMatch = text.match(/Reference\s*Number\s*:\s*([A-Za-z0-9\-]+)/i);
  if (refNoMatch && refNoMatch[1]) {
    data.refNo = refNoMatch[1].trim();
  }
  // Add more extraction rules here based on your document's structure.
  return data;
} 