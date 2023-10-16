import React, { useState, useEffect } from "react";
import { useUser } from "./UserContext";
import Sidebar from "./sidebar";
import AddTaskForm from "./AddTaskForm";
import "../Styles/tasktablenew.css";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

function TaskTable() {
  const [tasks, setTasks] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const { userData } = useUser();
  const userId = userData.user._id;
  //check box
  const [selectedTasks, setSelectedTasks] = useState([]);

  const fetchData = async () => {
    try {
      const response = await fetch(
        `http://ec2-13-53-38-51.eu-north-1.compute.amazonaws.com:3000/api/users/${userId}`
      );
      const data = await response.json();
      const userTasks = data.user.tasks;
      setTasks(userTasks);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const handleTaskAdded = (newTask) => {
    setTasks([...tasks, newTask]);
    setShowForm(false);
  };

  const handleCancelForm = () => {
    setShowForm(false);
  };

  //download
  const handleDownload = () => {
    const fileType =
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";

    const filteredTasks = tasks.map(
      ({
        taskId,
        taskName,
        assignedTo,
        priority,
        dueDate,
        completionStatus,
      }) => ({
        taskId,
        taskName,
        assignedTo,
        priority,
        dueDate,
        completionStatus,
      })
    );

    const ws = XLSX.utils.json_to_sheet(filteredTasks);
    const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: fileType });
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tasks.xlsx";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onTaskAdded = (newTask) => {
    setTasks([...tasks, newTask]);
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const excelData = XLSX.utils.sheet_to_json(sheet);

        for (const taskData of excelData) {
          try {
            const response = await fetch(
              `http://ec2-13-53-38-51.eu-north-1.compute.amazonaws.com:3000/api/users/${userId}/tasks`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(taskData),
              }
            );

            if (response.ok) {
              const newTask = await response.json();
              onTaskAdded(newTask);
            } else {
              console.error("Error adding task:", response.statusText);
            }
          } catch (error) {
            console.error("Error adding task:", error);
          }
        }
      } catch (error) {
        console.error("Error processing Excel data:", error);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  //handledownload
  const handleDownloadPDF = () => {
    const projectName = prompt("Enter project name:");
    if (projectName !== null) {
      const doc = new jsPDF();

      doc.text(`Project Name: ${projectName}`, 10, 10);

      // Get the table element
      const element = document.getElementById("taskTable");

      // Generate PDF from the table
      doc.autoTable({ html: element });

      const userEmail = userData.user.email;
      const timestamp = new Date().toLocaleString();

      // Calculate the vertical position for the email and timestamp
      const yPos = doc.internal.pageSize.height - 10;

      // Add user email and download date at the bottom
      doc.text(`User Email: ${userEmail}`, 10, yPos - 10);
      doc.text(`Downloaded at: ${timestamp}`, 10, yPos);

      // Save the PDF
      doc.save(`tasks_${projectName}.pdf`);
    }
  };

  //ceckbox functions

  const handleCheckboxChange = (taskId) => {
    const updatedSelectedTasks = [...selectedTasks];
    if (updatedSelectedTasks.includes(taskId)) {
      updatedSelectedTasks.splice(updatedSelectedTasks.indexOf(taskId), 1);
    } else {
      updatedSelectedTasks.push(taskId);
    }
    setSelectedTasks(updatedSelectedTasks);
  };

  const handleDeleteSelectedTasks = async () => {
    try {
      for (const taskId of selectedTasks) {
        const response = await fetch(
          `http://ec2-13-53-38-51.eu-north-1.compute.amazonaws.com:3000/api/users/${userId}/tasks/${taskId}`,
          {
            method: "DELETE",
          }
        );

        if (response.ok) {
          // Remove the deleted task from the state
          setTasks((prevTasks) =>
            prevTasks.filter((task) => task._id !== taskId)
          );
        } else {
          console.error(`Error deleting task ${taskId}:`, response.statusText);
        }
      }
      setSelectedTasks([]); // Clear selected tasks after deletion
    } catch (error) {
      console.error("Error deleting tasks:", error);
    }
  };

  //send email

  // TaskTable.js

  const handleSendEmail = async () => {
    const recipientEmail = prompt("Enter recipient email:");

    if (recipientEmail) {
      for (const taskId of selectedTasks) {
        const task = tasks.find((task) => task._id === taskId);
        if (task) {
          try {
            const response = await fetch(
              `http://ec2-13-53-38-51.eu-north-1.compute.amazonaws.com:3000/api/send-email`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  userId,
                  taskId,
                  recipientEmail,
                  taskName: task.taskName,
                  taskDetails: {
                    taskId: task.taskId,
                    taskName: task.taskName,
                    assignedTo: task.assignedTo,
                    priority: task.priority,
                    dueDate: task.dueDate,
                    completionStatus: task.completionStatus,
                  },
                }),
              }
            );

            if (response.ok) {
              alert(`Email for Task ID ${taskId} sent successfully!`);
            } else {
              alert(`Error sending email for Task ID ${taskId}.`);
            }
          } catch (error) {
            console.error(`Error sending email for Task ID ${taskId}:`, error);
            alert(`Error sending email for Task ID ${taskId}.`);
          }
        }
      }
    }
  };

  return (
    <>
      <Sidebar />
      <button className="button" onClick={() => setShowForm(true)}>
        Add Task
      </button>
      <button className="button" onClick={handleDownload}>
        Download Excel
      </button>
      <label htmlFor="fileInput" className="file-input-label">
        Upload Excel
      </label>
      <input
        id="fileInput"
        className="file-input"
        type="file"
        accept=".xlsx"
        onChange={handleFileUpload}
      />

      <button className="button" onClick={handleDownloadPDF}>
        Download PDF
      </button>
      <button
        className="button"
        onClick={handleDeleteSelectedTasks}
        disabled={!selectedTasks.length}
      >
        Delete Selected Tasks
      </button>
      <button
        className="button"
        onClick={handleSendEmail}
        disabled={!selectedTasks.length}
      >
        Send Mail
      </button>
      <button className="button" onClick={fetchData}>
        Reload Tasks
      </button>
      {showForm && (
        <div className="popup-overlay">
          <div className="popup-content">
            <span className="popup-close" onClick={() => setShowForm(false)}>
              &times;
            </span>
            <AddTaskForm
              userId={userId}
              onTaskAdded={handleTaskAdded}
              onCancel={handleCancelForm}
            />
          </div>
        </div>
      )}
      <div>
        <table id="taskTable">
          <thead>
            <tr>
              <th>Select task</th>
              <th>Task ID</th>
              <th>Task Name</th>
              <th>Assigned To</th>
              <th>Priority</th>
              <th>Due Date</th>
              <th>Completion Status</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task._id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedTasks.includes(task._id)}
                    onChange={() => handleCheckboxChange(task._id)}
                  />
                </td>
                <td>{task.taskId}</td>
                <td>{task.taskName}</td> {/* Accessing taskName here */}
                <td>{task.assignedTo}</td>
                <td>{task.priority}</td>
                <td>{task.dueDate}</td>
                <td>{task.completionStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default TaskTable;
//=========================================================================>>>>>>>>localhost 3000
// import React, { useState, useEffect } from "react";
// import { useUser } from "./UserContext";
// import Sidebar from "./sidebar";
// import AddTaskForm from "./AddTaskForm";
// import "../Styles/tasktablenew.css";
// import * as XLSX from "xlsx";
// import jsPDF from "jspdf";
// import "jspdf-autotable";

// function TaskTable() {
//   const [tasks, setTasks] = useState([]);
//   const [showForm, setShowForm] = useState(false);
//   const { userData } = useUser();
//   const userId = userData.user._id;
//   //check box
//   const [selectedTasks, setSelectedTasks] = useState([]);

//   const fetchData = async () => {
//     try {
//       const response = await fetch(`http://localhost:3000/api/users/${userId}`);
//       const data = await response.json();
//       const userTasks = data.user.tasks;
//       setTasks(userTasks);
//     } catch (error) {
//       console.error("Error fetching data:", error);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, [userId]);

//   const handleTaskAdded = (newTask) => {
//     setTasks([...tasks, newTask]);
//     setShowForm(false);
//   };

//   const handleCancelForm = () => {
//     setShowForm(false);
//   };

//   //download
//   const handleDownload = () => {
//     const fileType =
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";

//     const filteredTasks = tasks.map(
//       ({
//         taskId,
//         taskName,
//         assignedTo,
//         priority,
//         dueDate,
//         completionStatus,
//       }) => ({
//         taskId,
//         taskName,
//         assignedTo,
//         priority,
//         dueDate,
//         completionStatus,
//       })
//     );

//     const ws = XLSX.utils.json_to_sheet(filteredTasks);
//     const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
//     const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
//     const data = new Blob([excelBuffer], { type: fileType });
//     const url = URL.createObjectURL(data);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "tasks.xlsx";
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   const onTaskAdded = (newTask) => {
//     setTasks([...tasks, newTask]);
//   };

//   const handleFileUpload = async (event) => {
//     const file = event.target.files[0];
//     const reader = new FileReader();

//     reader.onload = async (e) => {
//       try {
//         const data = new Uint8Array(e.target.result);
//         const workbook = XLSX.read(data, { type: "array" });

//         const sheetName = workbook.SheetNames[0];
//         const sheet = workbook.Sheets[sheetName];

//         const excelData = XLSX.utils.sheet_to_json(sheet);

//         for (const taskData of excelData) {
//           try {
//             const response = await fetch(
//               `http://localhost:3000/api/users/${userId}/tasks`,
//               {
//                 method: "POST",
//                 headers: {
//                   "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify(taskData),
//               }
//             );

//             if (response.ok) {
//               const newTask = await response.json();
//               onTaskAdded(newTask);
//             } else {
//               console.error("Error adding task:", response.statusText);
//             }
//           } catch (error) {
//             console.error("Error adding task:", error);
//           }
//         }
//       } catch (error) {
//         console.error("Error processing Excel data:", error);
//       }
//     };

//     reader.readAsArrayBuffer(file);
//   };

//   //handledownload
//   const handleDownloadPDF = () => {
//     const projectName = prompt("Enter project name:");
//     if (projectName !== null) {
//       const doc = new jsPDF();

//       doc.text(`Project Name: ${projectName}`, 10, 10);

//       // Get the table element
//       const element = document.getElementById("taskTable");

//       // Generate PDF from the table
//       doc.autoTable({ html: element });

//       const userEmail = userData.user.email;
//       const timestamp = new Date().toLocaleString();

//       // Calculate the vertical position for the email and timestamp
//       const yPos = doc.internal.pageSize.height - 10;

//       // Add user email and download date at the bottom
//       doc.text(`User Email: ${userEmail}`, 10, yPos - 10);
//       doc.text(`Downloaded at: ${timestamp}`, 10, yPos);

//       // Save the PDF
//       doc.save(`tasks_${projectName}.pdf`);
//     }
//   };

//   //ceckbox functions

//   const handleCheckboxChange = (taskId) => {
//     const updatedSelectedTasks = [...selectedTasks];
//     if (updatedSelectedTasks.includes(taskId)) {
//       updatedSelectedTasks.splice(updatedSelectedTasks.indexOf(taskId), 1);
//     } else {
//       updatedSelectedTasks.push(taskId);
//     }
//     setSelectedTasks(updatedSelectedTasks);
//   };

//   const handleDeleteSelectedTasks = async () => {
//     try {
//       for (const taskId of selectedTasks) {
//         const response = await fetch(
//           `http://localhost:3000/api/users/${userId}/tasks/${taskId}`,
//           {
//             method: "DELETE",
//           }
//         );

//         if (response.ok) {
//           // Remove the deleted task from the state
//           setTasks((prevTasks) =>
//             prevTasks.filter((task) => task._id !== taskId)
//           );
//         } else {
//           console.error(`Error deleting task ${taskId}:`, response.statusText);
//         }
//       }
//       setSelectedTasks([]); // Clear selected tasks after deletion
//     } catch (error) {
//       console.error("Error deleting tasks:", error);
//     }
//   };

//   //send email

//   // TaskTable.js

//   const handleSendEmail = async () => {
//     const recipientEmail = prompt("Enter recipient email:");

//     if (recipientEmail) {
//       for (const taskId of selectedTasks) {
//         const task = tasks.find((task) => task._id === taskId);
//         if (task) {
//           try {
//             const response = await fetch(
//               `http://localhost:3000/api/send-email`,
//               {
//                 method: "POST",
//                 headers: {
//                   "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify({
//                   userId,
//                   taskId,
//                   recipientEmail,
//                   taskName: task.taskName,
//                   taskDetails: {
//                     taskId: task.taskId,
//                     taskName: task.taskName,
//                     assignedTo: task.assignedTo,
//                     priority: task.priority,
//                     dueDate: task.dueDate,
//                     completionStatus: task.completionStatus,
//                   },
//                 }),
//               }
//             );

//             if (response.ok) {
//               alert(`Email for Task ID ${taskId} sent successfully!`);
//             } else {
//               alert(`Error sending email for Task ID ${taskId}.`);
//             }
//           } catch (error) {
//             console.error(`Error sending email for Task ID ${taskId}:`, error);
//             alert(`Error sending email for Task ID ${taskId}.`);
//           }
//         }
//       }
//     }
//   };

//   return (
//     <>
//       <Sidebar />
//       <button className="button" onClick={() => setShowForm(true)}>
//         Add Task
//       </button>
//       <button className="button" onClick={handleDownload}>
//         Download Excel
//       </button>
//       <label htmlFor="fileInput" className="file-input-label">
//         Upload Excel
//       </label>
//       <input
//         id="fileInput"
//         className="file-input"
//         type="file"
//         accept=".xlsx"
//         onChange={handleFileUpload}
//       />

//       <button className="button" onClick={handleDownloadPDF}>
//         Download PDF
//       </button>
//       <button
//         className="button"
//         onClick={handleDeleteSelectedTasks}
//         disabled={!selectedTasks.length}
//       >
//         Delete Selected Tasks
//       </button>
//       <button
//         className="button"
//         onClick={handleSendEmail}
//         disabled={!selectedTasks.length}
//       >
//         Send Mail
//       </button>
//       <button className="button" onClick={fetchData}>
//         Reload Tasks
//       </button>
//       {showForm && (
//         <div className="popup-overlay">
//           <div className="popup-content">
//             <span className="popup-close" onClick={() => setShowForm(false)}>
//               &times;
//             </span>
//             <AddTaskForm
//               userId={userId}
//               onTaskAdded={handleTaskAdded}
//               onCancel={handleCancelForm}
//             />
//           </div>
//         </div>
//       )}
//       <div>
//         <table id="taskTable">
//           <thead>
//             <tr>
//               <th>Select task</th>
//               <th>Task ID</th>
//               <th>Task Name</th>
//               <th>Assigned To</th>
//               <th>Priority</th>
//               <th>Due Date</th>
//               <th>Completion Status</th>
//             </tr>
//           </thead>
//           <tbody>
//             {tasks.map((task) => (
//               <tr key={task._id}>
//                 <td>
//                   <input
//                     type="checkbox"
//                     checked={selectedTasks.includes(task._id)}
//                     onChange={() => handleCheckboxChange(task._id)}
//                   />
//                 </td>
//                 <td>{task.taskId}</td>
//                 <td>{task.taskName}</td> {/* Accessing taskName here */}
//                 <td>{task.assignedTo}</td>
//                 <td>{task.priority}</td>
//                 <td>{task.dueDate}</td>
//                 <td>{task.completionStatus}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </>
//   );
// }

// export default TaskTable;

//============================================================Original code belo==>>>>>>>>>>>>>>>>>>>>>
// import React, { useState, useEffect } from "react";
// import { useUser } from "./UserContext";
// import Sidebar from "./sidebar";
// import AddTaskForm from "./AddTaskForm";
// import "../Styles/tasktablenew.css";
// import * as XLSX from "xlsx";
// import jsPDF from "jspdf";
// import "jspdf-autotable";

// function TaskTable() {
//   const [tasks, setTasks] = useState([]);
//   const [showForm, setShowForm] = useState(false);
//   const { userData } = useUser();
//   const userId = userData.user._id;
//   //check box
//   const [selectedTasks, setSelectedTasks] = useState([]);

//   const fetchData = async () => {
//     try {
//       const response = await fetch(`http://localhost:3000/api/users/${userId}`);
//       const data = await response.json();
//       const userTasks = data.user.tasks;
//       setTasks(userTasks);
//     } catch (error) {
//       console.error("Error fetching data:", error);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, [userId]);

//   const handleTaskAdded = (newTask) => {
//     setTasks([...tasks, newTask]);
//     setShowForm(false);
//   };

//   const handleCancelForm = () => {
//     setShowForm(false);
//   };

//   //download
//   const handleDownload = () => {
//     const fileType =
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";

//     const filteredTasks = tasks.map(
//       ({
//         taskId,
//         taskName,
//         assignedTo,
//         priority,
//         dueDate,
//         completionStatus,
//       }) => ({
//         taskId,
//         taskName,
//         assignedTo,
//         priority,
//         dueDate,
//         completionStatus,
//       })
//     );

//     const ws = XLSX.utils.json_to_sheet(filteredTasks);
//     const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
//     const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
//     const data = new Blob([excelBuffer], { type: fileType });
//     const url = URL.createObjectURL(data);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "tasks.xlsx";
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   const onTaskAdded = (newTask) => {
//     setTasks([...tasks, newTask]);
//   };

//   const handleFileUpload = async (event) => {
//     const file = event.target.files[0];
//     const reader = new FileReader();

//     reader.onload = async (e) => {
//       try {
//         const data = new Uint8Array(e.target.result);
//         const workbook = XLSX.read(data, { type: "array" });

//         const sheetName = workbook.SheetNames[0];
//         const sheet = workbook.Sheets[sheetName];

//         const excelData = XLSX.utils.sheet_to_json(sheet);

//         for (const taskData of excelData) {
//           try {
//             const response = await fetch(
//               `http://localhost:3000/api/users/${userId}/tasks`,
//               {
//                 method: "POST",
//                 headers: {
//                   "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify(taskData),
//               }
//             );

//             if (response.ok) {
//               const newTask = await response.json();
//               onTaskAdded(newTask);
//             } else {
//               console.error("Error adding task:", response.statusText);
//             }
//           } catch (error) {
//             console.error("Error adding task:", error);
//           }
//         }
//       } catch (error) {
//         console.error("Error processing Excel data:", error);
//       }
//     };

//     reader.readAsArrayBuffer(file);
//   };

//   //handledownload
//   const handleDownloadPDF = () => {
//     const projectName = prompt("Enter project name:");
//     if (projectName !== null) {
//       const doc = new jsPDF();

//       doc.text(`Project Name: ${projectName}`, 10, 10);

//       // Get the table element
//       const element = document.getElementById("taskTable");

//       // Generate PDF from the table
//       doc.autoTable({ html: element });

//       const userEmail = userData.user.email;
//       const timestamp = new Date().toLocaleString();

//       // Calculate the vertical position for the email and timestamp
//       const yPos = doc.internal.pageSize.height - 10;

//       // Add user email and download date at the bottom
//       doc.text(`User Email: ${userEmail}`, 10, yPos - 10);
//       doc.text(`Downloaded at: ${timestamp}`, 10, yPos);

//       // Save the PDF
//       doc.save(`tasks_${projectName}.pdf`);
//     }
//   };

//   //ceckbox functions

//   const handleCheckboxChange = (taskId) => {
//     const updatedSelectedTasks = [...selectedTasks];
//     if (updatedSelectedTasks.includes(taskId)) {
//       updatedSelectedTasks.splice(updatedSelectedTasks.indexOf(taskId), 1);
//     } else {
//       updatedSelectedTasks.push(taskId);
//     }
//     setSelectedTasks(updatedSelectedTasks);
//   };

//   const handleDeleteSelectedTasks = async () => {
//     try {
//       for (const taskId of selectedTasks) {
//         const response = await fetch(
//           `http://localhost:3000/api/users/${userId}/tasks/${taskId}`,
//           {
//             method: "DELETE",
//           }
//         );

//         if (response.ok) {
//           // Remove the deleted task from the state
//           setTasks((prevTasks) =>
//             prevTasks.filter((task) => task._id !== taskId)
//           );
//         } else {
//           console.error(`Error deleting task ${taskId}:`, response.statusText);
//         }
//       }
//       setSelectedTasks([]); // Clear selected tasks after deletion
//     } catch (error) {
//       console.error("Error deleting tasks:", error);
//     }
//   };

//   //send email

//   // TaskTable.js

//   const handleSendEmail = async () => {
//     const recipientEmail = prompt("Enter recipient email:");

//     if (recipientEmail) {
//       for (const taskId of selectedTasks) {
//         try {
//           const response = await fetch(`http://localhost:3000/api/send-email`, {
//             method: "POST",
//             headers: {
//               "Content-Type": "application/json",
//             },
//             body: JSON.stringify({ userId, taskId, recipientEmail, taskName }),
//           });

//           if (response.ok) {
//             alert("Email sent successfully!");
//           } else {
//             alert("Error sending email.");
//           }
//         } catch (error) {
//           console.error("Error sending email:", error);
//           alert("Error sending email.");
//         }
//       }
//     }
//   };

//   // const handleSendEmail = async (userId, taskId, recipientEmail) => {
//   //   try {
//   //     const response = await fetch("http://localhost:3000/api/send-email", {
//   //       method: "POST",
//   //       headers: {
//   //         "Content-Type": "application/json",
//   //       },
//   //       body: JSON.stringify({ userId, taskId, recipientEmail }),
//   //     });

//   //     if (response.ok) {
//   //       alert("Email sent successfully!");
//   //     } else {
//   //       alert("Error sending email.");
//   //     }
//   //   } catch (error) {
//   //     console.error("Error sending email:", error);
//   //     alert("Error sending email.");
//   //   }
//   // };

//   // const handleSendEmail = async (userId, taskId, recipientEmail) => {
//   //   try {
//   //     const response = await fetch("/api/send-email", {
//   //       method: "POST",
//   //       headers: {
//   //         "Content-Type": "application/json",
//   //       },
//   //       body: JSON.stringify({ userId, taskId, recipientEmail }),
//   //     });

//   //     if (response.ok) {
//   //       alert("Email sent successfully!");
//   //     } else {
//   //       alert("Error sending email.");
//   //     }
//   //   } catch (error) {
//   //     console.error("Error sending email:", error);
//   //     alert("Error sending email.");
//   //   }
//   // };
//   return (
//     <>
//       <Sidebar />
//       <button className="button" onClick={() => setShowForm(true)}>
//         Add Task
//       </button>
//       <button className="button" onClick={handleDownload}>
//         Download Excel
//       </button>
//       <label htmlFor="fileInput" className="file-input-label">
//         Upload Excel
//       </label>
//       <input
//         id="fileInput"
//         className="file-input"
//         type="file"
//         accept=".xlsx"
//         onChange={handleFileUpload}
//       />

//       <button className="button" onClick={handleDownloadPDF}>
//         Download PDF
//       </button>
//       <button
//         className="button"
//         onClick={handleDeleteSelectedTasks}
//         disabled={!selectedTasks.length}
//       >
//         Delete Selected Tasks
//       </button>
//       <button
//         className="button"
//         onClick={handleSendEmail}
//         disabled={!selectedTasks.length}
//       >
//         Send Mail
//       </button>
//       <button className="button" onClick={fetchData}>
//         Reload Tasks
//       </button>
//       {showForm && (
//         <div className="popup-overlay">
//           <div className="popup-content">
//             <span className="popup-close" onClick={() => setShowForm(false)}>
//               &times;
//             </span>
//             <AddTaskForm
//               userId={userId}
//               onTaskAdded={handleTaskAdded}
//               onCancel={handleCancelForm}
//             />
//           </div>
//         </div>
//       )}
//       <div>
//         <table id="taskTable">
//           <thead>
//             <tr>
//               <th>Select task</th>
//               <th>Task ID</th>
//               <th>Task Name</th>
//               <th>Assigned To</th>
//               <th>Priority</th>
//               <th>Due Date</th>
//               <th>Completion Status</th>
//             </tr>
//           </thead>
//           <tbody>
//             {tasks.map((task) => (
//               <tr key={task._id}>
//                 <td>
//                   <input
//                     type="checkbox"
//                     checked={selectedTasks.includes(task._id)}
//                     onChange={() => handleCheckboxChange(task._id)}
//                   />
//                 </td>
//                 <td>{task.taskId}</td>
//                 <td>{task.taskName}</td>
//                 <td>{task.assignedTo}</td>
//                 <td>{task.priority}</td>
//                 <td>{task.dueDate}</td>
//                 <td>{task.completionStatus}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </>
//   );
// }

// export default TaskTable;
//=================================================================>>>>========== Original code =============>>>
// import React, { useState, useEffect } from "react";
// import { useUser } from "./UserContext";
// import Sidebar from "./sidebar";
// import AddTaskForm from "./AddTaskForm";
// import "../Styles/tasktablenew.css";
// import * as XLSX from "xlsx";
// import jsPDF from "jspdf";
// import "jspdf-autotable";

// function TaskTable() {
//   const [tasks, setTasks] = useState([]);
//   const [showForm, setShowForm] = useState(false);
//   const { userData } = useUser();
//   const userId = userData.user._id;
//   //check box
//   const [selectedTasks, setSelectedTasks] = useState([]);

//   const fetchData = async () => {
//     try {
//       const response = await fetch(`http://localhost:3000/api/users/${userId}`);
//       const data = await response.json();
//       const userTasks = data.user.tasks;
//       setTasks(userTasks);
//     } catch (error) {
//       console.error("Error fetching data:", error);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, [userId]);

//   const handleTaskAdded = (newTask) => {
//     setTasks([...tasks, newTask]);
//     setShowForm(false);
//   };

//   const handleCancelForm = () => {
//     setShowForm(false);
//   };

//   //download
//   const handleDownload = () => {
//     const fileType =
//       "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8";

//     const filteredTasks = tasks.map(
//       ({
//         taskId,
//         taskName,
//         assignedTo,
//         priority,
//         dueDate,
//         completionStatus,
//       }) => ({
//         taskId,
//         taskName,
//         assignedTo,
//         priority,
//         dueDate,
//         completionStatus,
//       })
//     );

//     const ws = XLSX.utils.json_to_sheet(filteredTasks);
//     const wb = { Sheets: { data: ws }, SheetNames: ["data"] };
//     const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
//     const data = new Blob([excelBuffer], { type: fileType });
//     const url = URL.createObjectURL(data);
//     const a = document.createElement("a");
//     a.href = url;
//     a.download = "tasks.xlsx";
//     a.click();
//     URL.revokeObjectURL(url);
//   };

//   const onTaskAdded = (newTask) => {
//     setTasks([...tasks, newTask]);
//   };

// const handleFileUpload = async (event) => {
//   const file = event.target.files[0];
//   const reader = new FileReader();

//   reader.onload = async (e) => {
//     try {
//       const data = new Uint8Array(e.target.result);
//       const workbook = XLSX.read(data, { type: "array" });

//       const sheetName = workbook.SheetNames[0];
//       const sheet = workbook.Sheets[sheetName];

//       const excelData = XLSX.utils.sheet_to_json(sheet);

//       // Iterate over excelData and add tasks
//       for (const taskData of excelData) {
//         try {
//           const response = await fetch(
//             `http://localhost:3000/api/users/${userId}/tasks`,
//             {
//               method: "POST",
//               headers: {
//                 "Content-Type": "application/json",
//               },
//               body: JSON.stringify(taskData), // Assuming taskData has the same structure as formData
//             }
//           );

//           if (response.ok) {
//             const newTask = await response.json();
//             onTaskAdded(newTask);
//           } else {
//             console.error("Error adding task:", response.statusText);
//           }
//         } catch (error) {
//           console.error("Error adding task:", error);
//         }
//       }
//     } catch (error) {
//       console.error("Error processing Excel data:", error);
//     }
//   };

//   reader.readAsArrayBuffer(file);
// };

//   //handledownload
//   const handleDownloadPDF = () => {
//     const projectName = prompt("Enter project name:");
//     if (projectName !== null) {
//       const doc = new jsPDF();

//       doc.text(`Project Name: ${projectName}`, 10, 10);

//       // Get the table element
//       const element = document.getElementById("taskTable");

//       // Generate PDF from the table
//       doc.autoTable({ html: element });

//       const userEmail = userData.user.email;
//       const timestamp = new Date().toLocaleString();

//       // Calculate the vertical position for the email and timestamp
//       const yPos = doc.internal.pageSize.height - 10;

//       // Add user email and download date at the bottom
//       doc.text(`User Email: ${userEmail}`, 10, yPos - 10);
//       doc.text(`Downloaded at: ${timestamp}`, 10, yPos);

//       // Save the PDF
//       doc.save(`tasks_${projectName}.pdf`);
//     }
//   };

//   //ceckbox functions

//   const handleCheckboxChange = (taskId) => {
//     const updatedSelectedTasks = [...selectedTasks];
//     if (updatedSelectedTasks.includes(taskId)) {
//       updatedSelectedTasks.splice(updatedSelectedTasks.indexOf(taskId), 1);
//     } else {
//       updatedSelectedTasks.push(taskId);
//     }
//     setSelectedTasks(updatedSelectedTasks);
//   };

//   const handleDeleteSelectedTasks = async () => {
//     try {
//       for (const taskId of selectedTasks) {
//         const response = await fetch(
//           `http://localhost:3000/api/users/${userId}/tasks/${taskId}`,
//           {
//             method: "DELETE",
//           }
//         );

//         if (response.ok) {
//           // Remove the deleted task from the state
//           setTasks((prevTasks) =>
//             prevTasks.filter((task) => task._id !== taskId)
//           );
//         } else {
//           console.error(`Error deleting task ${taskId}:`, response.statusText);
//         }
//       }
//       setSelectedTasks([]); // Clear selected tasks after deletion
//     } catch (error) {
//       console.error("Error deleting tasks:", error);
//     }
//   };

//   //send email
//   const handleSendEmail = async (userId, taskId, recipientEmail) => {
//     try {
//       const response = await fetch("/api/send-email", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ userId, taskId, recipientEmail }),
//       });

//       if (response.ok) {
//         alert("Email sent successfully!");
//       } else {
//         alert("Error sending email.");
//       }
//     } catch (error) {
//       console.error("Error sending email:", error);
//       alert("Error sending email.");
//     }
//   };
//   return (
//     <>
//       <Sidebar />
//       <button className="button" onClick={() => setShowForm(true)}>
//         Add Task
//       </button>
//       <button className="button" onClick={handleDownload}>
//         Download Excel
//       </button>
//       <label htmlFor="fileInput" className="file-input-label">
//         Upload Excel
//       </label>
//       <input
//         id="fileInput"
//         className="file-input"
//         type="file"
//         accept=".xlsx"
//         onChange={handleFileUpload}
//       />

//       <button className="button" onClick={handleDownloadPDF}>
//         Download PDF
//       </button>
//       <button
//         className="button"
//         onClick={handleDeleteSelectedTasks}
//         disabled={!selectedTasks.length}
//       >
//         Delete Selected Tasks
//       </button>
//       <button
//         className="button"
//         onClick={handleSendEmail}
//         disabled={!selectedTasks.length}
//       >
//         Send Mail
//       </button>
//       <button className="button" onClick={fetchData}>
//         Reload Tasks
//       </button>
//       {showForm && (
//         <div className="popup-overlay">
//           <div className="popup-content">
//             <span className="popup-close" onClick={() => setShowForm(false)}>
//               &times;
//             </span>
//             <AddTaskForm
//               userId={userId}
//               onTaskAdded={handleTaskAdded}
//               onCancel={handleCancelForm}
//             />
//           </div>
//         </div>
//       )}
//       <div>
//         <table id="taskTable">
//           <thead>
//             <tr>
//               <th>Select task</th>
//               <th>Task ID</th>
//               <th>Task Name</th>
//               <th>Assigned To</th>
//               <th>Priority</th>
//               <th>Due Date</th>
//               <th>Completion Status</th>
//             </tr>
//           </thead>
//           <tbody>
//             {tasks.map((task) => (
//               <tr key={task._id}>
//                 <td>
//                   <input
//                     type="checkbox"
//                     checked={selectedTasks.includes(task._id)}
//                     onChange={() => handleCheckboxChange(task._id)}
//                   />
//                 </td>
//                 <td>{task.taskId}</td>
//                 <td>{task.taskName}</td>
//                 <td>{task.assignedTo}</td>
//                 <td>{task.priority}</td>
//                 <td>{task.dueDate}</td>
//                 <td>{task.completionStatus}</td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </>
//   );
// }

// export default TaskTable;

//========================================================================>>>above for css

//========================================================================================>>>>

//////////////////////////////////////////////////////////////=====>>getting data

//==========================================================================>>> getting data

// import React, { useState } from "react";
// import jsPDF from "jspdf";
// import html2canvas from "html2canvas";
// import "../Styles/tasktable.css";
// import Sidebar from "../components/sidebar";
// import { FcNext, FcPrevious } from "react-icons/fc";
// import * as XLSX from "xlsx";
// import { Link } from "react-router-dom";

// function Tasktable() {
//   const [taskFormVisible, setTaskFormVisible] = useState(false);
//   const [newTask, setNewTask] = useState({
//     taskId: "",
//     taskName: "",
//     assignedTo: "",
//     priority: "Low",
//     dueDate: "",
//     completion: 0,
//   });

//   const [tasks, setTasks] = useState([]);

//   const handleAddTaskClick = () => {
//     setTaskFormVisible(true);
//   };

//   const handleFormInputChange = (event) => {
//     const { name, value } = event.target;
//     setNewTask({
//       ...newTask,
//       [name]: value,
//     });
//   };

//   const handleSubmitTask = () => {
//     setTasks([...tasks, newTask]);
//     setTaskFormVisible(false);
//     setNewTask({
//       taskId: "",
//       taskName: "",
//       assignedTo: "",
//       priority: "Low",
//       dueDate: "",
//       completion: 0,
//     });
//   };
//   async function downloadPDF() {
//     const input = document.getElementById("table-to-export");
//     if (!input) {
//       console.error("Element with id 'table-to-export' not found.");
//       return;
//     }

//     const canvas = await html2canvas(input);
//     const imgData = canvas.toDataURL("image/png");
//     const pdf = new jsPDF("p", "mm", "a4");
//     const imgProps = pdf.getImageProperties(imgData);
//     const pdfWidth = pdf.internal.pageSize.getWidth();
//     const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
//     pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
//     pdf.save("table-data.pdf");
//   }

//   const [sliderValue, setSliderValue] = useState(30);
//   const [currentPage, setCurrentPage] = useState(1);
//   const tasksPerPage = 9;

//   const handleSliderChange = (event) => {
//     const value = event.target.value;
//     setSliderValue(value);
//   };

//   const handlePageChange = (pageNumber) => {
//     setCurrentPage(pageNumber);
//   };

//   const indexOfLastTask = currentPage * tasksPerPage;
//   const indexOfFirstTask = indexOfLastTask - tasksPerPage;
//   const currentTasks = tasks.slice(indexOfFirstTask, indexOfLastTask);

//   const downloadExcel = () => {
//     const worksheet = XLSX.utils.json_to_sheet(tasks);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, "Task List");
//     XLSX.writeFile(workbook, "task-list.xlsx");
//   };

//   const handleFileUpload = (event) => {
//     const file = event.target.files[0];
//     const reader = new FileReader();

//     reader.onload = (e) => {
//       const data = new Uint8Array(e.target.result);
//       const workbook = XLSX.read(data, { type: "array" });

//       const sheetName = workbook.SheetNames[0];
//       const sheet = workbook.Sheets[sheetName];

//       const excelData = XLSX.utils.sheet_to_json(sheet);

//       // Update the state with the Excel data
//       setTasks(excelData);
//     };

//     reader.readAsArrayBuffer(file);
//   };
//   const handleSaveClick = () => {
//     try {
//       // Convert tasks data to JSON string
//       const tasksJSON = JSON.stringify(tasks);

//       // Store JSON string in local storage
//       localStorage.setItem("tasksData", tasksJSON);
//     } catch (error) {
//       console.error("Error saving data:", error);
//     }
//   };
//   return (
//     <div>
//       <div className="Header">
//         <div className="container header-container">
//           <div className="row">
//             <div className="col-4">
//               <h4>Task List</h4>
//             </div>
//             <div className="col-8 d-flex justify-content-end">
//               <button
//                 type="button"
//                 className="btn header-btn ms-4"
//                 onClick={handleAddTaskClick}
//               >
//                 Add Task
//               </button>
//               <label htmlFor="file-upload" className="btn header-btn ms-4">
//                 Upload
//               </label>
//               <input
//                 type="file"
//                 id="file-upload"
//                 accept=".xlsx, .xls"
//                 style={{ display: "none" }}
//                 onChange={handleFileUpload}
//               />
//               <button
//                 type="button"
//                 className="btn header-btn ms-4"
//                 onClick={downloadPDF}
//               >
//                 downloadPDF
//               </button>

//               <button
//                 type="button"
//                 className="btn header-btn ms-4"
//                 onClick={downloadExcel}
//               >
//                 Download Excel
//               </button>
//               <Link to="/save">
//                 <button
//                   type="button"
//                   className="btn header-btn ms-4"
//                   onClick={handleSaveClick}
//                 >
//                   Save as PDF
//                 </button>
//               </Link>
//             </div>
//           </div>
//         </div>
//       </div>
//       <Sidebar />
//       <div className="Tasktable mt-3">
//         <div className="container task-table">
//           {taskFormVisible && (
//             <div className="task-form">
//               <h5>Add Task</h5>
//               <form>
//                 <div className="mb-3">
//                   <label htmlFor="taskId" className="form-label">
//                     Task ID
//                   </label>
//                   <input
//                     type="text"
//                     className="form-control"
//                     id="taskId"
//                     name="taskId"
//                     value={newTask.taskId}
//                     onChange={handleFormInputChange}
//                   />
//                 </div>
//                 <div className="mb-3">
//                   <label htmlFor="taskName" className="form-label">
//                     Task Name
//                   </label>
//                   <input
//                     type="text"
//                     className="form-control"
//                     id="taskName"
//                     name="taskName"
//                     value={newTask.taskName}
//                     onChange={handleFormInputChange}
//                   />
//                 </div>
//                 <div className="mb-3">
//                   <label htmlFor="assignedTo" className="form-label">
//                     Assigned To
//                   </label>
//                   <input
//                     type="text"
//                     className="form-control"
//                     id="assignedTo"
//                     name="assignedTo"
//                     value={newTask.assignedTo}
//                     onChange={handleFormInputChange}
//                   />
//                 </div>
//                 <div className="mb-3">
//                   <label htmlFor="priority" className="form-label">
//                     Priority
//                   </label>
//                   <select
//                     className="form-select"
//                     id="priority"
//                     name="priority"
//                     value={newTask.priority}
//                     onChange={handleFormInputChange}
//                   >
//                     <option value="Low">Low</option>
//                     <option value="Medium">Medium</option>
//                     <option value="High">High</option>
//                   </select>
//                 </div>
//                 <div className="mb-3">
//                   <label htmlFor="dueDate" className="form-label">
//                     Due Date
//                   </label>
//                   <input
//                     type="date"
//                     className="form-control"
//                     id="dueDate"
//                     name="dueDate"
//                     value={newTask.dueDate}
//                     onChange={handleFormInputChange}
//                   />
//                 </div>
//                 <div className="mb-3">
//                   <label htmlFor="completion" className="form-label">
//                     Completion
//                   </label>
//                   <input
//                     type="range"
//                     className="form-range"
//                     id="completion"
//                     name="completion"
//                     min="0"
//                     max="100"
//                     value={newTask.completion}
//                     onChange={handleFormInputChange}
//                   />
//                 </div>
//                 <button
//                   type="button"
//                   className="btn btn-primary"
//                   onClick={handleSubmitTask}
//                 >
//                   Submit
//                 </button>
//               </form>
//             </div>
//           )}

//           <div className="table-container" id="table-to-export">
//             <table className="table container table-striped">
//               <thead>
//                 <tr>
//                   {/* Table headers */}
//                   <th scope="col">Task ID</th>
//                   <th scope="col">Task Name</th>
//                   <th scope="col">Assigned To</th>
//                   <th scope="col">Priority</th>
//                   <th scope="col">Due Date</th>
//                   <th scope="col">Completion</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {currentTasks.map((task, index) => (
//                   <tr key={index}>
//                     {/* Table cells */}
//                     <td>{task.taskId}</td>
//                     <td>{task.taskName}</td>
//                     <td>
//                       <div className="task-info">
//                         <img
//                           src={task.iconUrl}
//                           alt="Task Icon"
//                           className="task-icon"
//                         />
//                         {task.assignedTo}
//                       </div>
//                     </td>
//                     <td>{task.priority}</td>
//                     <td>{task.dueDate}</td>
//                     <td className="text-center">
//                       <div className="slider-container">
//                         <input
//                           type="range"
//                           value={sliderValue}
//                           min="0"
//                           max="100"
//                           step="1"
//                           className="progress"
//                           onChange={handleSliderChange}
//                         />
//                         <span>{sliderValue}%</span>
//                       </div>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//             <div className="pagination">
//               <button
//                 onClick={() => handlePageChange(currentPage - 1)}
//                 className={`pagination-button ${
//                   currentPage === 1 ? "disabled" : ""
//                 }`}
//                 disabled={currentPage === 1}
//               >
//                 <FcPrevious />
//               </button>
//               {Array.from({
//                 length: Math.ceil(tasks.length / tasksPerPage),
//               }).map((_, index) => (
//                 <button
//                   key={index}
//                   onClick={() => handlePageChange(index + 1)}
//                   className={`pagination-button ${
//                     currentPage === index + 1 ? "active" : ""
//                   }`}
//                 >
//                   {index + 1}
//                 </button>
//               ))}
//               <button
//                 onClick={() => handlePageChange(currentPage + 1)}
//                 className={`pagination-button ${
//                   currentPage === Math.ceil(tasks.length / tasksPerPage)
//                     ? "disabled"
//                     : ""
//                 }`}
//                 disabled={
//                   currentPage === Math.ceil(tasks.length / tasksPerPage)
//                 }
//               >
//                 <FcNext />
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default Tasktable;
