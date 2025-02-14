import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Azure OpenAI Configuration
const config = {
  endpoint: "https://tsrvision2155864922.cognitiveservices.azure.com/",
  deploymentId: "gpt-4o",  // Using gpt-4o model which supports vision
  apiVersion: "2024-08-01-preview",
  apiKey: "B2mqUjl2S8VlrzpuAoNsWMPriUfefEjzS8NpAZZ6yGeMHThCbO7rJQQJ99BBACYeBjFXJ3w3AAAAACOGt9Qm"
};

async function convertPDFToImage(pdfPath) {
  // Read the PDF file
  const pdfBytes = await fs.promises.readFile(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBytes);
  
  // Get the first page
  const page = pdfDoc.getPages()[0];
  const { width, height } = page.getSize();

  // Create a new PDF with just the first page
  const singlePagePdfDoc = await PDFDocument.create();
  const [copiedPage] = await singlePagePdfDoc.copyPages(pdfDoc, [0]);
  singlePagePdfDoc.addPage(copiedPage);

  // Save the single page PDF
  const tempPdfPath = path.join(__dirname, '../temp/temp.pdf');
  const pdfBytes2 = await singlePagePdfDoc.save();
  await fs.promises.writeFile(tempPdfPath, pdfBytes2);

  // Convert PDF to PNG using Sharp
  const outputPath = path.join(__dirname, '../temp/output.png');
  
  // Use GraphicsMagick to convert PDF to PNG (Sharp can't directly convert PDF)
  const { execSync } = await import('child_process');
  execSync(`magick convert -density 300 "${tempPdfPath}" "${outputPath}"`);

  // Read the PNG file and convert to base64
  const imageBuffer = await fs.promises.readFile(outputPath);
  
  // Clean up temporary files
  await fs.promises.unlink(tempPdfPath);
  await fs.promises.unlink(outputPath);

  return imageBuffer.toString('base64');
}

async function extractDetailsWithAzureOpenAI(pdfPath) {
  const { default: fetch } = await import('node-fetch');
  
  console.log("Converting PDF to images...");
  
  // Create temp directory if it doesn't exist
  const tempDir = path.join(__dirname, '../temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  try {
    // Convert PDF to base64 image
    const base64Image = await convertPDFToImage(pdfPath);

    const fullEndpoint = `${config.endpoint}/openai/deployments/${config.deploymentId}/chat/completions?api-version=${config.apiVersion}`;

    const requestBody = {
      messages: [
        { 
          role: "system", 
          content: "You are an assistant that extracts details from land records, specifically Jamabandi documents. Return only valid JSON without any additional text."
        },
        { 
          role: "user", 
          content: [
            {
              type: "text",
              text: `Extract the following fields from this Jamabandi document and return a valid JSON object matching the structure below.
If a field is not found, leave it as null or empty string.

{
  "jamabandi": {
    "calendarYearStart": "Start year of the Jamabandi",
    "calendarYearEnd": "End year of the Jamabandi",
    "khasraEntries": [{
      "khasraNo": "Khasra number",
      "ownership": "Ownership details",
      "area": "Area details"
    }]
  },
  "videMutation": {
    "mutationNumber": "Mutation number if available",
    "mutationDate": "Date of mutation in YYYY-MM-DD format",
    "description": "Mutation description",
    "change": "Details of the change"
  },
  "girdwari": {
    "khasraNo": "Khasra number",
    "village": "Village name",
    "tehsil": "Tehsil name",
    "district": "District name",
    "natureOfLand": "Nature of land",
    "areaHectare": "Area in hectare",
    "areaBigha": "Area in bigha",
    "khatedar": "Khatedar details",
    "boundaries": "Boundary details"
  },
  "milanKshetrafal": {
    "khasraNo": "Khasra number",
    "recordNumber": "Record number",
    "milanDate": "Date in YYYY-MM-DD format",
    "areaHectare": "Area in hectare",
    "areaBigha": "Area in bigha",
    "description": "Description of milan kshetrafal"
  },
  "settlementRecord": {
    "settlementDate": "Settlement date in YYYY-MM-DD format",
    "authority": "Authority details",
    "caseNumber": "Case/Reference number",
    "parties": "Parties involved",
    "terms": "Settlement terms",
    "legalDescription": "Legal description"
  }
}`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 4000,
      temperature: 0,
      response_format: { type: "json_object" }
    };

    console.log("Making API request...");
    const response = await fetch(fullEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": config.apiKey
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Full API Response:", errorData);
      throw new Error(`Azure OpenAI API request failed: ${response.statusText}\nDetails: ${JSON.stringify(errorData, null, 2)}`);
    }

    const responseData = await response.json();
    console.log("API Response received successfully");
    
    if (!responseData.choices || !responseData.choices[0]?.message?.content) {
      console.error("Unexpected API response format:", responseData);
      throw new Error("Invalid API response format");
    }

    return JSON.parse(responseData.choices[0].message.content);
  } catch (error) {
    console.error("Detailed error:", error);
    throw error;
  } finally {
    // Clean up temp directory if empty
    if (fs.existsSync(tempDir) && fs.readdirSync(tempDir).length === 0) {
      fs.rmdirSync(tempDir);
    }
  }
}

async function processPDF(pdfPath) {
  try {
    console.log("Extracting details using Azure OpenAI Vision...");
    const extractedData = await extractDetailsWithAzureOpenAI(pdfPath);
    fs.writeFileSync(
      'output_extracted.json', 
      JSON.stringify(extractedData, null, 2)
    );
    console.log("Extracted JSON saved to output_extracted.json");
  } catch (error) {
    console.error("Error processing PDF:", error);
  }
}

// Check if PDF path is provided as command line argument
const pdfPath = process.argv[2];
if (!pdfPath) {
  console.error("Please provide the path to the PDF file as an argument");
  console.log("Usage: node test-extraction-cli.js path/to/apna_khata.pdf");
  process.exit(1);
}

// Run the processing
processPDF(pdfPath); 
