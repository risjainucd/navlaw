// Encapsulate the code in an IIFE to avoid polluting the global namespace
(() => {
  "use strict";

  let entryCount = 0;
  let generatedDoc; // Will store the generated DOCX document

  // Utility function to capitalize text
  const capitalize = (text) => {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  };

  // Create a new khasra entry (used by Jamabandi)
  const createKhasraEntry = () => {
    const div = document.createElement("div");
    div.className = "khasraEntry";
    div.innerHTML = `
      <div class="mb-2">
        <label class="form-label">Khasra No:</label>
        <input type="text" class="form-control khasraNo" required>
      </div>
      <div class="mb-2">
        <label class="form-label">Ownership:</label>
        <input type="text" class="form-control ownership" required>
      </div>
      <div class="mb-2">
        <label class="form-label">Area:</label>
        <input type="text" class="form-control area" required>
      </div>
      <span class="delete-btn">Delete</span>
    `;
    // Attach delete event
    div.querySelector(".delete-btn").addEventListener("click", () => {
      div.remove();
    });
    return div;
  };

  // Add a new Chain-of-Title entry
  const addEntry = () => {
    entryCount++;
    const entryType = document.getElementById("entryTypeSelect").value;
    const tableBody = document.querySelector("#chainTable tbody");
    const tr = document.createElement("tr");
    tr.id = "entryRow" + entryCount;
    tr.dataset.type = entryType;

    // Type cell
    const tdType = document.createElement("td");
    tdType.textContent = capitalize(entryType);

    // Details cell – contents vary based on entry type
    const tdDetails = document.createElement("td");

    if (entryType === "jamabandi") {
      // Jamabandi: Calendar years and one (or more) khasra details.
      const jamDiv = document.createElement("div");
      jamDiv.classList.add("mb-2");
      jamDiv.innerHTML = `
        <div class="mb-2">
          <label class="form-label">Calendar Year Start:</label>
          <input type="number" class="form-control calendarYearStart" required>
        </div>
        <div class="mb-2">
          <label class="form-label">Calendar Year End:</label>
          <input type="number" class="form-control calendarYearEnd" required>
        </div>
      `;
      tdDetails.appendChild(jamDiv);

      // Container for khasra details
      const khasraContainer = document.createElement("div");
      khasraContainer.id = "khasraContainer" + entryCount;
      khasraContainer.appendChild(createKhasraEntry());
      tdDetails.appendChild(khasraContainer);

      // Button to add additional khasra entries
      const addKhasraBtn = document.createElement("button");
      addKhasraBtn.type = "button";
      addKhasraBtn.textContent = "Add More Khasra";
      addKhasraBtn.className = "btn btn-sm btn-info mt-2";
      addKhasraBtn.addEventListener("click", () => {
        const container = document.getElementById("khasraContainer" + entryCount);
        if (container) {
          container.appendChild(createKhasraEntry());
        }
      });
      tdDetails.appendChild(addKhasraBtn);
    } else if (entryType === "videMutation") {
      tdDetails.innerHTML = `
        <div class="mb-2">
          <label class="form-label">Mutation Number:</label>
          <input type="text" class="form-control mutationNumber" required>
        </div>
        <div class="mb-2">
          <label class="form-label">Date of Mutation:</label>
          <input type="date" class="form-control mutationDate" required>
        </div>
        <div class="mb-2">
          <label class="form-label">Description:</label>
          <textarea class="form-control mutationDescription" required></textarea>
        </div>
        <div class="mb-2">
          <label class="form-label">Change:</label>
          <textarea class="form-control mutationChange" required></textarea>
        </div>
      `;
    } else if (entryType === "girdwari") {
      tdDetails.innerHTML = `
        <div class="row g-2 mb-2">
          <div class="col-md-3">
              <label class="form-label">Khasra No:</label>
              <input type="text" class="form-control khasraNo" required>
          </div>
          <div class="col-md-3">
              <label class="form-label">Village:</label>
              <input type="text" class="form-control village" required>
          </div>
          <div class="col-md-3">
              <label class="form-label">Tehsil:</label>
              <input type="text" class="form-control tehsil" required>
          </div>
          <div class="col-md-3">
              <label class="form-label">District:</label>
              <input type="text" class="form-control district" required>
          </div>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-md-4">
              <label class="form-label">Nature of Land:</label>
              <input type="text" class="form-control natureOfLand" value="Agricultural Land - Barani-II" required>
          </div>
          <div class="col-md-4">
              <label class="form-label">Area (Hectare):</label>
              <input type="number" class="form-control areaHectare" required>
          </div>
          <div class="col-md-4">
              <label class="form-label">Area (Bigha):</label>
              <input type="text" class="form-control areaBigha" readonly>
          </div>
        </div>
        <div class="mb-2">
          <label class="form-label">Khatedar:</label>
          <textarea class="form-control khatedar" rows="3" required></textarea>
        </div>
        <div class="mb-2">
          <label class="form-label">Boundaries:</label>
          <input type="text" class="form-control boundaries" required>
        </div>
      `;
      // For area conversion (hectare to bigha)
      const areaInput = tdDetails.querySelector(".areaHectare");
      areaInput.addEventListener("input", function() {
        updateBigha(this);
      });
    } else if (entryType === "milanKshetrafal") {
      tdDetails.innerHTML = `
        <div class="row g-2 mb-2">
          <div class="col-md-4">
              <label class="form-label">Khasra No:</label>
              <input type="text" class="form-control khasraNoMilan" required>
          </div>
          <div class="col-md-4">
              <label class="form-label">Record No:</label>
              <input type="text" class="form-control recordNumberMilan" required>
          </div>
          <div class="col-md-4">
              <label class="form-label">Milan Date:</label>
              <input type="date" class="form-control milanDate" required>
          </div>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-md-6">
              <label class="form-label">Area (Hectare):</label>
              <input type="number" class="form-control areaHectareMilan" required>
          </div>
          <div class="col-md-6">
              <label class="form-label">Area (Bigha):</label>
              <input type="text" class="form-control areaBighaMilan" readonly>
          </div>
        </div>
        <div class="mb-2">
          <label class="form-label">Description:</label>
          <textarea class="form-control milanDescription" rows="3" required></textarea>
        </div>
      `;
      const areaInputMilan = tdDetails.querySelector(".areaHectareMilan");
      areaInputMilan.addEventListener("input", function() {
         updateBighaMilan(this);
      });
    } else if (entryType === "settlementRecord") {
      tdDetails.innerHTML = `
        <div class="row g-2 mb-2">
          <div class="col-md-4">
              <label class="form-label">Settlement Date:</label>
              <input type="date" class="form-control settlementDate" required>
          </div>
          <div class="col-md-4">
              <label class="form-label">Authority:</label>
              <input type="text" class="form-control authority" required>
          </div>
          <div class="col-md-4">
              <label class="form-label">Case/Reference No:</label>
              <input type="text" class="form-control caseNumber" required>
          </div>
        </div>
        <div class="mb-2">
          <label class="form-label">Parties Involved:</label>
          <textarea class="form-control parties" rows="2" required></textarea>
        </div>
        <div class="mb-2">
          <label class="form-label">Settlement Terms:</label>
          <textarea class="form-control terms" rows="3" required></textarea>
        </div>
        <div class="mb-2">
          <label class="form-label">Legal Description:</label>
          <textarea class="form-control legalDescription" rows="3" required></textarea>
        </div>
      `;
    }

    // Actions cell: Delete entry button
    const tdActions = document.createElement("td");
    const delButton = document.createElement("button");
    delButton.type = "button";
    delButton.className = "btn btn-danger btn-sm";
    delButton.textContent = "Delete Entry";
    delButton.addEventListener("click", () => {
      deleteEntry(tr);
    });
    tdActions.appendChild(delButton);

    tr.appendChild(tdType);
    tr.appendChild(tdDetails);
    tr.appendChild(tdActions);
    tableBody.appendChild(tr);
  };

  // Remove an entry row from the table
  const deleteEntry = (rowElement) => {
    rowElement.remove();
  };

  // Convert area from hectares to bigha for Girdwari
  const updateBigha = (inputElement) => {
    const row = inputElement.closest("tr");
    const hectareValue = parseFloat(inputElement.value) || 0;
    const bighaInput = row.querySelector(".areaBigha");
    const biswaPerHectare = 79;
    const totalBiswaInOneBigha = 20;
    const totalBiswa = Math.round(hectareValue * biswaPerHectare);
    const bighaValue = Math.floor(totalBiswa / totalBiswaInOneBigha);
    const biswaValue = totalBiswa % totalBiswaInOneBigha;
    if (bighaInput) {
      bighaInput.value = `${bighaValue} bigha ${biswaValue} biswa`;
    }
  };

  // Convert area from hectares to bigha for Milan Kshetrafal
  const updateBighaMilan = (inputElement) => {
    const row = inputElement.closest("tr");
    const hectareValue = parseFloat(inputElement.value) || 0;
    const bighaInput = row.querySelector(".areaBighaMilan");
    const biswaPerHectare = 79;
    const totalBiswaInOneBigha = 20;
    const totalBiswa = Math.round(hectareValue * biswaPerHectare);
    const bighaValue = Math.floor(totalBiswa / totalBiswaInOneBigha);
    const biswaValue = totalBiswa % totalBiswaInOneBigha;
    if (bighaInput) {
      bighaInput.value = `${bighaValue} bigha ${biswaValue} biswa`;
    }
  };

  // Generate the report and build the DOCX document
  const generateReport = () => {
    let report = "";
    const lawFirm = document.getElementById("lawFirm").value;
    const refNo = document.getElementById("refNo").value;
    const dateInput = document.getElementById("dateInput").value;
    const toAddress = document.getElementById("toAddress").value;
    report += `Law Firm: ${lawFirm}\n`;
    report += `Reference Number: ${refNo}\n`;
    report += `Date: ${dateInput}\n`;
    report += `To Address:\n${toAddress}\n\n`;
    report += `Chain of Title:\n\n`;

    const rows = document.querySelectorAll("#chainTable tbody tr");
    rows.forEach(row => {
      const entryType = row.dataset.type;
      report += `Entry Type: ${capitalize(entryType)}\n`;
      if (entryType === "jamabandi") {
        const calendarYearStart = row.querySelector(".calendarYearStart").value;
        const calendarYearEnd = row.querySelector(".calendarYearEnd").value;
        report += `Calendar Year: ${calendarYearStart} - ${calendarYearEnd}\n`;
        const khasraEntries = row.querySelectorAll(".khasraEntry");
        khasraEntries.forEach(kDiv => {
          const khasraNo = kDiv.querySelector(".khasraNo").value;
          const ownership = kDiv.querySelector(".ownership").value;
          const area = kDiv.querySelector(".area").value;
          report += `   Khasra no. ${khasraNo}, Ownership: ${ownership}, Area: ${area}\n`;
        });
      } else if (entryType === "videMutation") {
        const mutationNumber = row.querySelector(".mutationNumber").value;
        const mutationDate = row.querySelector(".mutationDate").value;
        const mutationDescription = row.querySelector(".mutationDescription").value;
        const mutationChange = row.querySelector(".mutationChange").value;
        report += `Mutation Number: ${mutationNumber}\n`;
        report += `Date of Mutation: ${mutationDate}\n`;
        report += `Description: ${mutationDescription}\n`;
        report += `Change: ${mutationChange}\n`;
      } else if (entryType === "girdwari") {
        const khasraNo = row.querySelector('.khasraNo').value;
        const village = row.querySelector('.village').value;
        const tehsil = row.querySelector('.tehsil').value;
        const district = row.querySelector('.district').value;
        const natureOfLand = row.querySelector('.natureOfLand').value;
        const areaHectare = row.querySelector('.areaHectare').value;
        const areaBigha = row.querySelector('.areaBigha').value;
        const khatedar = row.querySelector('.khatedar').value;
        const boundaries = row.querySelector('.boundaries').value;
        report += `Khasra No: ${khasraNo}\n`;
        report += `Village: ${village}, Tehsil: ${tehsil}, District: ${district}\n`;
        report += `Nature of Land: ${natureOfLand}\n`;
        report += `Area: ${areaHectare} Hectare (${areaBigha})\n`;
        report += `Khatedar:\n${khatedar}\n`;
        report += `Boundaries: ${boundaries}\n`;
      } else if (entryType === "milanKshetrafal") {
        const khasraNoMilan = row.querySelector('.khasraNoMilan').value;
        const recordNumberMilan = row.querySelector('.recordNumberMilan').value;
        const milanDate = row.querySelector('.milanDate').value;
        const areaHectareMilan = row.querySelector('.areaHectareMilan').value;
        const areaBighaMilan = row.querySelector('.areaBighaMilan').value;
        const milanDescription = row.querySelector('.milanDescription').value;
        report += `Khasra No: ${khasraNoMilan}\n`;
        report += `Record No: ${recordNumberMilan}\n`;
        report += `Milan Date: ${milanDate}\n`;
        report += `Area: ${areaHectareMilan} Hectare (${areaBighaMilan})\n`;
        report += `Description: ${milanDescription}\n`;
      } else if (entryType === "settlementRecord") {
        const settlementDate = row.querySelector('.settlementDate').value;
        const authority = row.querySelector('.authority').value;
        const caseNumber = row.querySelector('.caseNumber').value;
        const parties = row.querySelector('.parties').value;
        const terms = row.querySelector('.terms').value;
        const legalDescription = row.querySelector('.legalDescription').value;
        report += `Settlement Date: ${settlementDate}\n`;
        report += `Authority: ${authority}\n`;
        report += `Case/Ref No: ${caseNumber}\n`;
        report += `Parties Involved:\n${parties}\n`;
        report += `Settlement Terms:\n${terms}\n`;
        report += `Legal Description:\n${legalDescription}\n`;
      }
      report += `\n`;
    });
    document.getElementById("generatedReport").textContent = report;
    generateDocx(report);
  };

  // Build the DOCX document from the report text
  const generateDocx = (reportText) => {
    const { Document, Paragraph, TextRun, AlignmentType } = docx;
    generatedDoc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "Chain of Title Report",
                bold: true,
                size: 32
              })
            ],
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({ text: reportText })
        ]
      }]
    });
  };

  // Download the generated DOCX file
  const downloadDocx = async () => {
    if (!generatedDoc) {
      alert("Please generate the report first.");
      return;
    }
    const { Packer } = docx;
    const blob = await Packer.toBlob(generatedDoc);
    saveAs(blob, "Chain_of_Title_Report.docx");
  };

  // Bind events once the DOM is fully loaded
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("addEntryButton").addEventListener("click", addEntry);
    document.getElementById("generateReportButton").addEventListener("click", generateReport);
    document.getElementById("downloadDocxButton").addEventListener("click", downloadDocx);
  });
})(); 