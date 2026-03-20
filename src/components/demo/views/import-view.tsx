"use client";

import { useState, useRef } from "react";
import {
  Download,
  Upload,
  FileSpreadsheet,
  Check,
  AlertTriangle,
  ChevronRight,
  Users,
  X,
} from "lucide-react";
import { type Contact, type StageDefinition } from "../data";

interface CustomField {
  id: string;
  label: string;
  type: "text" | "number" | "date" | "select";
  options?: string[];
}

interface ImportViewProps {
  contacts: Contact[];
  stages: StageDefinition[];
  customFields: CustomField[];
  customFieldValues: Record<string, Record<string, string>>;
  onImportContacts: (contacts: Contact[], newFieldValues: Record<string, Record<string, string>>) => void;
  contactsRemaining?: number; // null/undefined = unlimited, number = how many more can be added
}

const avatarColors = [
  "bg-blue-500", "bg-emerald-500", "bg-violet-500", "bg-rose-500",
  "bg-cyan-500", "bg-amber-500", "bg-indigo-500", "bg-teal-500",
  "bg-pink-500", "bg-sky-500", "bg-orange-500", "bg-lime-500",
];

const steps = [
  { num: 1, title: "Set up your fields", description: "Choose which fields you want to import for each contact." },
  { num: 2, title: "Download template", description: "Get a CSV template that matches your field setup." },
  { num: 3, title: "Fill in your data", description: "Open the CSV in Excel or Google Sheets and add your contacts." },
  { num: 4, title: "Upload & import", description: "Upload the filled CSV and we'll populate your contacts." },
];

const defaultFields = [
  { key: "name", label: "Name", required: true, enabled: true },
  { key: "email", label: "Email", required: false, enabled: true },
  { key: "company", label: "Company", required: false, enabled: true },
  { key: "role", label: "Role / Title", required: false, enabled: true },
  { key: "phone", label: "Phone", required: false, enabled: true },
  { key: "stage", label: "Pipeline Stage", required: false, enabled: true },
  { key: "value", label: "Deal Value", required: false, enabled: true },
  { key: "tags", label: "Tags", required: false, enabled: false },
  { key: "owner", label: "Owner", required: false, enabled: false },
];

export default function ImportView({ contacts, stages, customFields, customFieldValues, onImportContacts, contactsRemaining }: ImportViewProps) {
  const [activeStep, setActiveStep] = useState(1);

  // Build fields list: default fields + any custom fields
  const customFieldEntries = customFields.map((cf) => ({
    key: `custom_${cf.id}`,
    label: cf.label,
    required: false,
    enabled: true,
    isCustom: true,
    customFieldId: cf.id,
  }));

  const [fields, setFields] = useState([
    ...defaultFields,
    ...customFieldEntries,
  ]);
  const [importedData, setImportedData] = useState<Record<string, string>[]>([]);
  const [importComplete, setImportComplete] = useState(false);
  const [importCount, setImportCount] = useState(0);
  const [parseError, setParseError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const enabledFields = fields.filter((f) => f.enabled);

  function toggleField(key: string) {
    setFields((prev) =>
      prev.map((f) => (f.key === key && !f.required ? { ...f, enabled: !f.enabled } : f))
    );
  }

  async function downloadTemplate() {
    const ExcelJS = (await import("exceljs")).default;
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Contacts");

    // Headers
    const headerRow = sheet.addRow(enabledFields.map((f) => f.label));
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4F6BED" } };
      cell.alignment = { horizontal: "center" };
    });

    // Sample row
    const sampleValues = enabledFields.map((f) => {
      switch (f.key) {
        case "name": return "Jane Smith";
        case "email": return "jane@company.com";
        case "company": return "Acme Corp";
        case "role": return "VP of Sales";
        case "phone": return "(555) 123-4567";
        case "stage": return stages[0]?.label || "Lead";
        case "value": return 10000;
        case "tags": return "Enterprise;Priority";
        case "owner": return "You";
        default: {
          const cf = customFields.find((c) => `custom_${c.id}` === f.key);
          if (cf) {
            if (cf.type === "number") return 0;
            if (cf.type === "date") return new Date().toISOString().slice(0, 10);
            if (cf.type === "select" && cf.options?.length) return cf.options[0];
            return "";
          }
          return "";
        }
      }
    });
    sheet.addRow(sampleValues);

    // Auto-width columns
    sheet.columns.forEach((col, i) => {
      col.width = Math.max(enabledFields[i]?.label.length + 4, 18);
    });

    // Add data validation (dropdowns) for rows 2-500
    enabledFields.forEach((f, colIdx) => {
      const colLetter = String.fromCharCode(65 + colIdx); // A, B, C, ...
      let options: string[] | null = null;

      if (f.key === "stage") {
        options = stages.map((s) => s.label);
      } else if (f.key.startsWith("custom_")) {
        const cf = customFields.find((c) => `custom_${c.id}` === f.key);
        if (cf?.type === "select" && cf.options?.length) {
          options = cf.options;
        }
      }

      if (options && options.length > 0) {
        for (let row = 2; row <= 500; row++) {
          const cell = sheet.getCell(`${colLetter}${row}`);
          cell.dataValidation = {
            type: "list",
            allowBlank: true,
            formulae: [`"${options.join(",")}"`],
            showErrorMessage: true,
            errorTitle: "Invalid value",
            error: `Please select from: ${options.join(", ")}`,
          };
        }
      }
    });

    // Add a "Valid Options" reference sheet
    const refSheet = workbook.addWorksheet("Valid Options");
    refSheet.getCell("A1").value = "Field";
    refSheet.getCell("B1").value = "Valid Options";
    refSheet.getRow(1).font = { bold: true };
    let refRow = 2;

    // Pipeline stages
    if (enabledFields.some((f) => f.key === "stage")) {
      refSheet.getCell(`A${refRow}`).value = "Pipeline Stage";
      refSheet.getCell(`B${refRow}`).value = stages.map((s) => s.label).join(", ");
      refRow++;
    }

    // Custom select fields
    customFields.filter((cf) => cf.type === "select" && cf.options?.length).forEach((cf) => {
      if (enabledFields.some((f) => f.key === `custom_${cf.id}`)) {
        refSheet.getCell(`A${refRow}`).value = cf.label;
        refSheet.getCell(`B${refRow}`).value = cf.options!.join(", ");
        refRow++;
      }
    });

    refSheet.getColumn(1).width = 20;
    refSheet.getColumn(2).width = 50;

    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "workchores-import-template.xlsx";
    a.click();
    URL.revokeObjectURL(url);
    setActiveStep(3);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError("");

    const isXlsx = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

    if (isXlsx) {
      try {
        const ExcelJS = (await import("exceljs")).default;
        const workbook = new ExcelJS.Workbook();
        const buffer = await file.arrayBuffer();
        await workbook.xlsx.load(buffer);
        const sheet = workbook.getWorksheet("Contacts") || workbook.worksheets[0];
        if (!sheet || sheet.rowCount < 2) {
          setParseError("Spreadsheet must have a header row and at least one data row.");
          return;
        }

        // Extract plain text from a cell, stripping hyperlinks and rich text
        function cellToString(cellValue: unknown): string {
          if (cellValue == null) return "";
          if (typeof cellValue === "string") return cellValue.trim();
          if (typeof cellValue === "number" || typeof cellValue === "boolean") return String(cellValue);
          if (cellValue instanceof Date) return cellValue.toISOString().slice(0, 10);
          // Hyperlink object: { text: "...", hyperlink: "..." }
          if (typeof cellValue === "object" && "text" in (cellValue as Record<string, unknown>)) {
            const text = (cellValue as Record<string, unknown>).text;
            if (typeof text === "string") return text.trim();
            // Rich text: { richText: [{ text: "..." }, ...] }
            if (text && typeof text === "object" && "richText" in (text as Record<string, unknown>)) {
              return ((text as Record<string, unknown>).richText as { text: string }[]).map((r) => r.text).join("").trim();
            }
            return String(text || "");
          }
          // Rich text directly: { richText: [{ text: "..." }, ...] }
          if (typeof cellValue === "object" && "richText" in (cellValue as Record<string, unknown>)) {
            return ((cellValue as Record<string, unknown>).richText as { text: string }[]).map((r) => r.text).join("").trim();
          }
          return String(cellValue).trim();
        }

        const headers: string[] = [];
        sheet.getRow(1).eachCell((cell, colNum) => {
          headers[colNum - 1] = cellToString(cell.value);
        });

        const rows: Record<string, string>[] = [];
        for (let r = 2; r <= sheet.rowCount; r++) {
          const row: Record<string, string> = {};
          let hasData = false;
          sheet.getRow(r).eachCell((cell, colNum) => {
            const val = cellToString(cell.value);
            if (val) hasData = true;
            row[headers[colNum - 1] || `Col${colNum}`] = val;
          });
          if (hasData) rows.push(row);
        }

        if (rows.length === 0) {
          setParseError("No valid data rows found in the spreadsheet.");
          return;
        }
        setImportedData(rows);
        setActiveStep(4);
      } catch {
        setParseError("Could not read the Excel file. Please check the format.");
      }
    } else {
      // CSV parsing
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const lines = text.trim().split("\n").map((l) => l.trim()).filter(Boolean);
        if (lines.length < 2) {
          setParseError("CSV must have a header row and at least one data row.");
          return;
        }

        const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
        const rows: Record<string, string>[] = [];

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
          const row: Record<string, string> = {};
          headers.forEach((h, idx) => {
            row[h] = values[idx] || "";
          });
          if (row[headers[0]]) rows.push(row);
        }

        if (rows.length === 0) {
          setParseError("No valid data rows found in the CSV.");
          return;
        }
        setImportedData(rows);
        setActiveStep(4);
      };
      reader.readAsText(file);
    }
  }

  function confirmImport() {
    const headerMap: Record<string, string> = {};
    enabledFields.forEach((f) => {
      headerMap[f.label] = f.key;
    });

    const newContacts: Contact[] = importedData.map((row, i) => {
      const id = crypto.randomUUID();
      const name = Object.entries(row).find(([h]) => headerMap[h] === "name")?.[1] || `Contact ${i + 1}`;
      const email = Object.entries(row).find(([h]) => headerMap[h] === "email")?.[1] || "";
      const company = Object.entries(row).find(([h]) => headerMap[h] === "company")?.[1] || "";
      const role = Object.entries(row).find(([h]) => headerMap[h] === "role")?.[1] || "";
      const phone = Object.entries(row).find(([h]) => headerMap[h] === "phone")?.[1] || "";
      const stage = Object.entries(row).find(([h]) => headerMap[h] === "stage")?.[1] || stages[0]?.label || "Lead";
      const valueStr = Object.entries(row).find(([h]) => headerMap[h] === "value")?.[1] || "0";
      const tagsStr = Object.entries(row).find(([h]) => headerMap[h] === "tags")?.[1] || "";
      const owner = Object.entries(row).find(([h]) => headerMap[h] === "owner")?.[1] || "You";

      const initials = name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);
      const colorIdx = (contacts.length + i) % avatarColors.length;

      return {
        id,
        name,
        email,
        company,
        role,
        phone,
        avatar: initials || "??",
        avatarColor: avatarColors[colorIdx],
        stage,
        value: parseInt(valueStr.replace(/[^0-9]/g, ""), 10) || 0,
        owner,
        lastContact: new Date().toISOString().slice(0, 10),
        created: new Date().toISOString().slice(0, 10),
        tags: tagsStr ? tagsStr.split(";").map((t) => t.trim()).filter(Boolean) : [],
      };
    });

    // Extract custom field values per contact
    const newFieldValues: Record<string, Record<string, string>> = {};
    newContacts.forEach((contact, i) => {
      const row = importedData[i];
      const cfValues: Record<string, string> = {};
      enabledFields.forEach((f) => {
        if (f.key.startsWith("custom_")) {
          const cfId = f.key.replace("custom_", "");
          const val = Object.entries(row).find(([h]) => headerMap[h] === f.key)?.[1] || "";
          if (val) cfValues[cfId] = val;
        }
      });
      if (Object.keys(cfValues).length > 0) {
        newFieldValues[contact.id] = cfValues;
      }
    });

    onImportContacts(newContacts, newFieldValues);
    setImportCount(newContacts.length);
    setImportComplete(true);
  }

  function reset() {
    setActiveStep(1);
    setImportedData([]);
    setImportComplete(false);
    setImportCount(0);
    setParseError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Import Contacts</h2>
        <p className="text-sm text-muted mt-1">Bring your existing contacts into WorkChores in 4 easy steps.</p>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2 flex-1">
            <button
              onClick={() => !importComplete && setActiveStep(s.num)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                importComplete || activeStep > s.num
                  ? "bg-emerald-500 text-white"
                  : activeStep === s.num
                  ? "bg-accent text-white"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              {importComplete || activeStep > s.num ? <Check className="w-3.5 h-3.5" /> : s.num}
            </button>
            <div className="hidden sm:block flex-1 min-w-0">
              <div className={`text-xs font-medium truncate ${activeStep === s.num ? "text-foreground" : "text-muted"}`}>
                {s.title}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className={`hidden sm:block w-8 h-px ${activeStep > s.num ? "bg-emerald-400" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Success state */}
      {importComplete ? (
        <div className="bg-white rounded-xl border border-border p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">
            {importCount} contact{importCount !== 1 ? "s" : ""} imported!
          </h3>
          <p className="text-sm text-muted mb-6">
            Your contacts are now in the system. View them in your contacts list or pipeline.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={reset}
              className="px-4 py-2.5 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-gray-50 transition-colors"
            >
              Import More
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Step 1: Choose fields */}
          {activeStep === 1 && (
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Choose fields to import</h3>
                <p className="text-xs text-muted mt-0.5">Select which fields you want in your CSV template. Required fields cannot be disabled.</p>
              </div>
              <div className="divide-y divide-border">
                {fields.map((f) => (
                  <div key={f.key} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleField(f.key)}
                        disabled={f.required}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          f.enabled
                            ? "bg-accent border-accent"
                            : "border-gray-300 hover:border-gray-400"
                        } ${f.required ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
                      >
                        {f.enabled && <Check className="w-3 h-3 text-white" />}
                      </button>
                      <span className="text-sm text-foreground">{f.label}</span>
                      {f.required && (
                        <span className="text-[10px] font-medium bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Required</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 border-t border-border bg-surface/30">
                <button
                  onClick={() => setActiveStep(2)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors"
                >
                  Next: Download Template
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Download template */}
          {activeStep === 2 && (
            <div className="bg-white rounded-xl border border-border p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-accent-light flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Download your CSV template</h3>
              <p className="text-sm text-muted mb-2 max-w-md mx-auto">
                Your template includes {enabledFields.length} columns: {enabledFields.map((f) => f.label).join(", ")}.
              </p>
              <p className="text-xs text-muted mb-6">
                Open it in Excel, Google Sheets, or any spreadsheet app and fill in your contact data.
              </p>
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors shadow-lg shadow-accent/20"
              >
                <Download className="w-4 h-4" />
                Download Template (.xlsx)
              </button>
            </div>
          )}

          {/* Step 3: Fill in data (informational) */}
          {activeStep === 3 && (
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="p-6 text-center border-b border-border">
                <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto mb-4">
                  <FileSpreadsheet className="w-8 h-8 text-amber-600" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Fill in your contacts</h3>
                <p className="text-sm text-muted max-w-md mx-auto">
                  Open the downloaded template in Excel or Google Sheets. Add one contact per row — dropdown fields will show valid options. Then come back here to upload.
                </p>
              </div>
              <div className="p-5 bg-surface/30">
                <div className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">Tips</div>
                <ul className="space-y-2 text-sm text-muted">
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />Keep the header row — don&apos;t rename the columns</li>
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />Every row needs at least a Name</li>
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />For tags, separate multiple values with semicolons (;)</li>
                  <li className="flex items-start gap-2"><Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />Pipeline Stage should match one of: {stages.map((s) => s.label).join(", ")}</li>
                </ul>
              </div>
              <div className="px-5 py-4 border-t border-border">
                <label className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  Upload Filled File
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Step 4: Preview & confirm */}
          {activeStep === 4 && (
            <div className="bg-white rounded-xl border border-border overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Preview import</h3>
                    <p className="text-xs text-muted mt-0.5">{importedData.length} contact{importedData.length !== 1 ? "s" : ""} ready to import</p>
                  </div>
                  <button
                    onClick={() => { setActiveStep(3); setImportedData([]); if (fileRef.current) fileRef.current.value = ""; }}
                    className="text-xs text-muted hover:text-foreground transition-colors"
                  >
                    Upload different file
                  </button>
                </div>
              </div>

              {parseError && (
                <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2 text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {parseError}
                </div>
              )}

              {/* Preview table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface/50">
                      {Object.keys(importedData[0] || {}).slice(0, 6).map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-xs font-medium text-muted">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {importedData.slice(0, 10).map((row, i) => (
                      <tr key={i} className="hover:bg-surface/30">
                        {Object.values(row).slice(0, 6).map((v, j) => (
                          <td key={j} className="px-4 py-2.5 text-foreground truncate max-w-[180px]">{v || <span className="text-gray-300">—</span>}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importedData.length > 10 && (
                  <div className="px-4 py-2 text-xs text-muted text-center border-t border-border">
                    + {importedData.length - 10} more row{importedData.length - 10 !== 1 ? "s" : ""}
                  </div>
                )}
              </div>

              {contactsRemaining !== undefined && contactsRemaining !== null && importedData.length > contactsRemaining && (
                <div className="px-5 py-3 border-t border-amber-200 bg-amber-50 text-xs text-amber-800">
                  Free plan allows {contactsRemaining} more contact{contactsRemaining !== 1 ? "s" : ""}. This import has {importedData.length}. Upgrade to Business for unlimited contacts.
                </div>
              )}
              <div className="px-5 py-4 border-t border-border bg-surface/30 flex items-center gap-3">
                <button
                  onClick={confirmImport}
                  disabled={contactsRemaining !== undefined && contactsRemaining !== null && importedData.length > contactsRemaining}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-accent hover:bg-accent-dark rounded-lg transition-colors shadow-lg shadow-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Users className="w-4 h-4" />
                  Import {importedData.length} Contact{importedData.length !== 1 ? "s" : ""}
                </button>
                <button
                  onClick={() => { setActiveStep(3); setImportedData([]); }}
                  className="px-4 py-2.5 text-sm font-medium text-muted hover:text-foreground border border-border rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
