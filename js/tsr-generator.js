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
        <label class="form-label">Area (Hectare):</label>
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
          <input type="number" class="form-control calendarYearStart" required>
        </div>
        <div class="mb-2">
          <label class="form-label">Ownership:</label>
          <input type="text" class="form-control ownership" required>
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
      const mutationType = document.getElementById("entryTypeSelect").value;
      const mutationTemplate = getMutationTemplate(mutationType);
      
      tdDetails.innerHTML = `
        <div class="mb-2">
          <label class="form-label">Mutation Type:</label>
          <select class="form-select mutationType" required>
            <option value="death">Death Mutation</option>
            <option value="saleOld">Sale Mutation (Old)</option>
            <option value="saleNew">Sale Mutation (New)</option>
            <option value="releaseOld">Release Mutation (Old)</option>
            <option value="releaseNew">Release Mutation (New)</option>
            <option value="giftNew">Gift Mutation (New)</option>
            <option value="bankMortgage">Bank Mortgage Mutation</option>
            <option value="bankRelease">Bank Release Mutation</option>
            <option value="khatedari">Khatedari Mutation</option>
            <option value="other">Other Mutation</option>
          </select>
        </div>
        <div class="mb-2">
          <label class="form-label">Mutation Text:</label>
          <textarea class="form-control mutationText" rows="6">${mutationTemplate}</textarea>
        </div>
        <button type="button" class="btn btn-primary finalizeMutation">Finalize Text</button>
      `;

      // Add event listener for mutation type change
      tdDetails.querySelector(".mutationType").addEventListener("change", (e) => {
        const newType = e.target.value;
        const textarea = tdDetails.querySelector(".mutationText");
        textarea.value = getMutationTemplate(newType);
      });

      // Add event listener for finalize button
      tdDetails.querySelector(".finalizeMutation").addEventListener("click", () => {
        const textarea = tdDetails.querySelector(".mutationText");
        textarea.readOnly = true;
        tdDetails.querySelector(".finalizeMutation").disabled = true;
      });
    } else if (entryType === "girdwari") {
      tdDetails.innerHTML = `
      <div class="mb-2">
          <label class="form-label">Calendar Year Start:</label>
          <input type="number" class="form-control calendarYearStart" required>
        </div>
        <div class="mb-2">
          <label class="form-label">Calendar Year Start:</label>
          <input type="number" class="form-control calendarYearStart" required>
        </div>
        <div class="row g-2 mb-2">
          <div class="col-md-3">
              <label class="form-label">Khasra No:</label>
              <input type="text" class="form-control khasraNo" required>
          </div>
          
        <div class="mb-2">
          <label class="form-label">Khatedar:</label>
          <textarea class="form-control khatedar" rows="3" required></textarea>
        </div>
      `;
      // For area conversion (hectare to bigha)
      // const areaInput = tdDetails.querySelector(".areaHectare");
      // areaInput.addEventListener("input", function() {
        // updateBigha(this);
      // });
    } else if (entryType === "milanKshetrafal") {
      tdDetails.innerHTML = `
        <div class="row g-2 mb-2">
          <div class="col-md-4">
              <label class="form-label">old Khasra no:</label>
              <input type="text" class="form-control oldKhasra" required>
          </div>
      `;
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
    } else if (entryType === "settlementRecord") {
      tdDetails.innerHTML = `
        <div class="row g-2 mb-2">
          <div class="col-md-4">
              <label class="form-label">From:</label>
              <input type="date" class="form-control fromDate" required>
          </div>
          <div class="col-md-4">
              <label class="form-label">To:</label>
              <input type="date" class="form-control toDate" required>
          </div>
          <div class="mb-2">
            <label class="form-label">Khatedar:</label>
            <textarea class="form-control khatedar" rows="3" required></textarea>
          </div>
          <div class="mb-2">
          <label class="form-label">Observation</label>
          <textarea class="form-control observation" required></textarea>
        </div>
      `;
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
      // report += `Entry Type: ${capitalize(entryType)}\n`;
      if (entryType === "jamabandi") {
        const calendarYearStart = row.querySelector(".calendarYearStart").value;
        const calendarYearEnd = row.querySelector(".calenderYearEnd").value;
        const ownership = row.querySelector(".ownership").value;
        // report += `Calendar Year: ${calendarYearStart} - ${calendarYearEnd}\n`;
        report+=`Jamabandi of Samvat ${calendarYearStart+57}-${calendarYearEnd} corresponding to the Calendar Year ${calendarYearStart}-${calendarYearEnd} reflects\n`
        const khasraEntries = row.querySelectorAll(".khasraEntry");
        let totalArea=0;
        khasraEntries.forEach(kDiv => {
          const khasraNo = kDiv.querySelector(".khasraNo").value;
          const area = kDiv.querySelector(".area").value;
          totalArea+=area;
          report+=`Khasra no. ${khasraNo} area measuring ${area} Hectare\n`;
        });
        report+=`Total Khasra ${khasraEntries.length} and Total area measuring ${totalArea} are recorded in name of ${ownership}, as Khatedar.\n`;
      } else if (entryType === "videMutation") {
        const mutationText = row.querySelector(".mutationText").value;
        report += mutationText + '\n';
      } else if (entryType === "girdwari") {
        const calendarYearStart = row.querySelector(".calendarYearStart").value;
        const calendarYearEnd = row.querySelector(".calendarYearEnd").value;
        const khasraNo = row.querySelector('.khasraNo').value;
        const khatedar = row.querySelector('.khatedar').value;
        report+=`Girdawari of Samvat ${calendarYearStart+57}-${calendarYearEnd+57} corresponding to the Calendar Year ${calendarYearStart}-${calendarYearEnd} reflects Khasra no. ${khasraNo} are recorded in name of ${khatedar}, as Khatedar\n`
      } else if (entryType === "milanKshetrafal") {
        const oldKhasra = row.querySelector('.oldKhasra').value;
        const khasraEntries = row.querySelectorAll(".khasraEntry");
        let totalArea = 0;
        if (khasraEntries.length===1){
          report+=`Copy of the Milan Kshetrafal shows old Khasra no. ${oldKhasra} is rearranged as Khasra No. ${khasraEntries[0].khasraNo} Area measuring ${khasraEntries[0].area} Hectare\n`;
        }
        else if (khasraEntries.length>1){
        report+=`Copy of the Milan Kshetrafal shows old Khasra no. ${oldKhasra} Min is rearranged as under: -\n`
        khasraEntries.forEach(kDiv => {
          const khasraNo = kDiv.querySelector(".khasraNo").value;
          const area = kDiv.querySelector(".area").value;
          totalArea+=area;
          report+=`\tKhasra no. ${khasraNo} area measuring ${area} Hectare\n`;
        });
        report+=`\t Total Khasra ${khasraEntries.length} and Total area measuring ${totalArea} Hectare\n`
      }
      } else if (entryType === "settlementRecord") {
        const khasraEntries = row.querySelectorAll(".khasraEntry");
        const khatedar = row.querySelector('.khatedar').value;
        const toDate = row.querySelector(".toDate").value;
        const fromDate = row.querySelector(".toDate").value;
        const toyear = toDate.value.split('-')[0]; 
        if (khasraEntries.length ===1){
          report+=`The Settlement Record for the year's Samvat ${toyear+57} to ${toyear+76} calendar year ${toDate} to ${fromDate} shows Khasra no. ${khasraEntries[0].khasraNo} area measuring ${khasraEntries[0].area} Hectare is recorded in name of ${khatedar} as Khatedar.\n`
        }
        else{
          let totalArea=0;
          report+=`The Settlement Record for the year's Samvat ${toyear+57} to ${toyear+76} calendar year ${toDate} to ${fromDate} shows\n`;
          khasraEntries.forEach(kDiv => {
            const khasraNo = kDiv.querySelector(".khasraNo").value;
            const area = kDiv.querySelector(".area").value;
            totalArea+=area;
            report+=`\tKhasra no. ${khasraNo} area measuring ${area} Hectare\n`;
          });
          report+=`\t Total Khasra ${khasraEntries.length} and Total area measuring ${totalArea} Hectare are recorded in name of ${khatedar} as Khatedar.\n`
        }
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

  // Function to get mutation template based on type
  const getMutationTemplate = (mutationType) => {
    switch(mutationType) {
      case 'death':
        return `Vide Mutation no. [number] dated [date], Khatedar [name] died and his land bearing Khasra no. [khasra] came to be mutated in his legal heirs i.e., [heirs], as Khatedar.`;
      case 'saleOld':
        return `Vide Mutation no. [number] dated [date], the effect of the Sale Deed of the Khatedar [name], Registered at Sub Registrar Pugal, in Book no. 1, Volume no. 71 at Page no. 21 at Serial no. 167 dated 08.05.2000, he sold ½ share from his land bearing Khasra no. [khasra] to [buyer], as Khatedar.`;
      case 'saleNew':
        return `Vide Mutation no. [number] dated [date], the effect of the Sale Deed of Khatedar [name], registered at Sub Registrar Bikaner, bearing registration no. 202403058102162, dated 26.02.2024, they sold their respective share of land bearing Khasra no. [khasra] to [buyer], as Khatedar.`;
      case 'releaseOld':
        return `Vide Mutation no. [number] dated [date], The effect of the Release Deed of Khatedar [name], registered at Sub Registrar Pugal, in Book no. 1, Volume no. 75 at Page no. 71 at Serial no. 62 dated 19.01.2002, they released their share of land bearing Khasra no. [khasra] in favor of [beneficiary], as Khatedar.`;
      case 'releaseNew':
        return `Vide Mutation no. [number] dated [date], the effect of the Release Deed of Khatedar [name], registered at Sub Registrar Bikaner, bearing registration no. 20240305-8102162, dated 26.02.2024, they released their respective share of land bearing Khasra no. [khasra] in favor of [beneficiary], as Khatedar.`;
      case 'giftNew':
        return `Vide Mutation no. [number] dated [date], the effect of the Gift Deed of Khatedar [name], registered at Sub Registrar Bikaner bearing registration no. 202403058104735, dated 29.04.2024, he gifted his land bearing Khasra no. [khasra] to [recipient], as Khatedar.`;
      case 'bankMortgage':
        return `Vide Mutation no. [number] dated [date], Khatedar [name] mortgaged his share of land bearing Khasra no. [khasra] with State Bank of Bikaner and Jaipur, Branch Jamsar.`;
      case 'bankRelease':
        return `Vide Mutation no. [number] dated [date], Land share of Khatedar [name] of land bearing Khasra no. [khasra] were freed from Bank Mortgaged of State Bank of India, Branch Jamsar.`;
      case 'khatedari':
        return `Vide Mutation no. [number] dated [date], in pursuance to the order dated 02.09.1998 bearing no. 14 passed by Tehsildar Bikaner, Khatedari rights of the Land bearing Khasra no. [khasra] were given to [recipient], as Khatedar.`;
      case 'other':
        return `Vide Mutation no. [number] dated [date], [custom text]`;
      default:
        return `Vide Mutation no. [number] dated [date], [custom text]`;
    }
  };

  // Bind events once the DOM is fully loaded
  document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("addEntryButton").addEventListener("click", addEntry);
    document.getElementById("generateReportButton").addEventListener("click", generateReport);
    document.getElementById("downloadDocxButton").addEventListener("click", downloadDocx);
  });
})(); 