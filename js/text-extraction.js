import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument } from 'pdf-lib';
import sharp from 'sharp';
import pdf from 'pdf-parse';

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
  
  // Use ImageMagick to convert PDF to PNG
  const { execSync } = await import('child_process');
  execSync(`magick -density 300 "${tempPdfPath}" "${outputPath}"`);

  // Read the PNG file and convert to base64
  const imageBuffer = await fs.promises.readFile(outputPath);
  
  // Clean up temporary files
  await fs.promises.unlink(tempPdfPath);
  await fs.promises.unlink(outputPath);

  return imageBuffer.toString('base64');
}

async function extractDetailsWithAzureOpenAI(pdfPath) {
  const { default: fetch } = await import('node-fetch');
  
  console.log("Extracting text from PDF...");

  // Read the PDF file and extract text
  const pdfData = await fs.promises.readFile(pdfPath);
  const pdfText = await pdf(pdfData).then(data => data.text);

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
              text: `
                Task: Extract structured data from a land record (Jamabandi) image converted from PDF to PNG format.

Input Format:
- Image type: PNG converted from PDF
- Language: Hindi text (Devanagari script)
- Document type: Jamabandi (Form P-26(C))

Required Output Format:
{
  "Village": "",           // Extract from "ग्राम का नाम"
  "Tehsil": "",           // Extract from "तहसील"
  "District": "",          // Extract from "जिला"
  "Samvat_year_st": "",    // First year from "संवत"
  "Samvat_year_end": "",   // Last year from "संवत"
  "Khatedar": "",          // Extract from "काश्तकार का नाम"
  "Khasra": [
    {
      "KhasraNo": "",      // Extract from "खसरा संख्या"
      "TotalArea": "",     // Extract from "क्षेत्रफल"
      "Division": [
        {
          "Landtype": "",  // Extract from "भूमि वर्गीकरण"
          "Area": ""       // Corresponding area for each land type
        }
      ]
    }
  ],
  "TotalKhasras": "",     // Extract from "कुल खसरे"
  "TotalArea": "",        // Total area from bottom row
}

Key Extraction Guidelines:

1. Field Identification:
   - Look for consistent header patterns
   - Identify table structures and boundaries
   - Handle multi-line entries in Khatedar details
   - Recognize column headers in the Khasra table

2. Data Cleaning:
   - Remove any header/footer artifacts
   - Clean up extra spaces and special characters
   - Standardize number formats
   - Handle partial or blurred text

3. Common Variations to Handle:
   - Different table layouts
   - Merged cells in Khasra table
   - Multiple land types per Khasra
   - Various date formats
   - Different header placements

4. Quality Checks:
   - Verify total area matches sum of individual Khasras
   - Ensure all required fields are populated
   - Validate number formats
   - Check for logical consistency in dates

Special Handling Instructions:
1. Numbers:
   - Preserve exact decimal places as shown in image
   - Handle both Hindi and English numerals
   - Verify area calculations

2. Text:
   - Maintain original spelling of place names
   - Preserve full details in Khatedar field
   - Keep land type descriptions as shown

3. Dates:
   - Convert dates to consistent format (DD-MMM-YYYY)
   - Handle both Hindi and English date formats
   - Account for Samvat year conversions if needed

Error Handling:
- Flag missing or unclear fields
- Note any inconsistencies in totals
- Identify potential OCR errors
- Mark fields requiring human verification

Remember:
- All measurements should be in hectares
- Preserve original precision in numerical values
- Maintain all relationship details in Khatedar field
- Include any relevant mutation (नामान्तरकरण) details in notes
                `
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