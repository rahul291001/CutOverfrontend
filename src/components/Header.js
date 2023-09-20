import React from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "../Styles/header.css";

function Header({}) {
  async function downloadPDF() {
    const input = document.getElementById("table-to-export");
    if (!input) {
      console.error("Element with id 'table-to-export' not found.");
      return;
    }

    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("table-data.pdf");
  }

  return (
    <div className="Header">
      <div className="container header-container">
        <div className="row">
          <div className="col-4">
            <h4>Task List</h4>
          </div>
          <div className="col-8 d-flex justify-content-end">
            <button type="button" className="btn header-btn ms-4">
              Add Task
            </button>
            <button type="button" className="btn header-btn ms-4">
              Upload
            </button>
            <button
              type="button"
              className="btn header-btn ms-4"
              onClick={downloadPDF}
            >
              Download
            </button>
            <button type="button" className="btn header-btn ms-4">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Header;
