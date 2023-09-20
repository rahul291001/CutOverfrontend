import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";

function SavePage() {
  const [tableData, setTableData] = useState([]);

  useEffect(() => {
    const tasksJSON = localStorage.getItem("tasksData");

    if (tasksJSON) {
      try {
        const parsedData = JSON.parse(tasksJSON);
        setTableData(parsedData);
      } catch (error) {
        console.error("Error parsing data:", error);
      }
    }
  }, []);

  function saveAsPDF() {
    const divContent = document.getElementById("content");
    const pdf = new jsPDF();

    pdf.html(divContent, {
      callback: function (pdf) {
        const fileName = "document.pdf";
        pdf.save(fileName);
      },
    });
  }

  return (
    <div>
      <h2>Save Page</h2>
      <button onClick={saveAsPDF}>Save as PDF</button>
      <pre id="content">{JSON.stringify(tableData, null, 2)}</pre>
    </div>
  );
}

export default SavePage;
