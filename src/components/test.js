// // option1

// import React, { useState, useEffect } from "react";
// import { useUser } from "./UserContext";
// import Sidebar from "./sidebar";
// import AddTaskForm from "./AddTaskForm";
// import "../Styles/tasktablenew.css";
// import * as XLSX from "xlsx";
// import jsPDF from "jspdf";
// import "jspdf-autotable";

// function TaskTable() {
//   // ... (existing code)

//   // New state variables for filtering
//   const [filterType, setFilterType] = useState("taskId");
//   const [filterValue, setFilterValue] = useState("");

//   const handleFilterChange = (e) => {
//     setFilterType(e.target.value);
//     setFilterValue("");
//   };

//   const handleFilterValueChange = (e) => {
//     setFilterValue(e.target.value);
//   };

//   // Function to filter tasks
//   const filteredTasks = tasks.filter((task) => {
//     if (filterType === "taskId") {
//       return task.taskId.includes(filterValue);
//     } else if (filterType === "completionStatus") {
//       return task.completionStatus === filterValue;
//     }
//     return true; // If no filter applied, return all tasks
//   });

//   // ... (rest of the code)

//   return (
//     <>
//       <Sidebar />
//       <button onClick={() => setShowForm(true)}>Add Task</button>
//       <button onClick={handleDownload}>Download Excel</button>
//       <input type="file" accept=".xlsx" onChange={handleFileUpload} />
//       <button onClick={handleDownloadPDF}>Download PDF</button>
//       <button
//         onClick={handleDeleteSelectedTasks}
//         disabled={!selectedTasks.length}
//       >
//         Delete Selected Tasks
//       </button>
//       {/* Filter options */}
//       <div>
//         <label>
//           Filter by:
//           <select value={filterType} onChange={handleFilterChange}>
//             <option value="taskId">Task ID</option>
//             <option value="completionStatus">Completion Status</option>
//           </select>
//         </label>
//         {filterType !== "taskId" && (
//           <select value={filterValue} onChange={handleFilterValueChange}>
//             <option value="completed">Completed</option>
//             <option value="progress">Progress</option>
//             <option value="issue">Issue</option>
//           </select>
//         )}
//         {filterType === "taskId" && (
//           <input
//             type="text"
//             value={filterValue}
//             onChange={handleFilterValueChange}
//           />
//         )}
//       </div>
//       <div>
//         <button onClick={fetchData}>Reload Tasks</button>
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
//             {filteredTasks.map((task) => (
//               <tr key={task._id}>
//                 {/* ... (rest of the code) */}
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </>
//   );
// }

// export default TaskTable;

// /////
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

//   //filter
//   const [filterType, setFilterType] = useState("taskId");
//   const [filterValue, setFilterValue] = useState("");

//   //filter finction
//   const handleFilterChange = (e) => {
//     setFilterType(e.target.value);
//     setFilterValue("");
//   };

//   const handleFilterValueChange = (e) => {
//     setFilterValue(e.target.value);
//   };

//   // Function to filter tasks
//   const filteredTasks = tasks.filter((task) => {
//     if (filterType === "taskId") {
//       return task.taskId.includes(filterValue);
//     } else if (filterType === "completionStatus") {
//       return task.completionStatus === filterValue;
//     }
//     return true; // If no filter applied, return all tasks
//   });

//   //filer function

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

//         // Iterate over excelData and add tasks
//         for (const taskData of excelData) {
//           try {
//             const response = await fetch(
//               `http://localhost:3000/api/users/${userId}/tasks`,
//               {
//                 method: "POST",
//                 headers: {
//                   "Content-Type": "application/json",
//                 },
//                 body: JSON.stringify(taskData), // Assuming taskData has the same structure as formData
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
//   const handleSendMail = async () => {
//     const selectedTaskIds = selectedTasks;

//     if (selectedTaskIds.length === 0) {
//       alert("Please select at least one task.");
//       return;
//     }

//     const recipientEmail = prompt("Enter recipient's email:");
//     if (recipientEmail === null) {
//       return; // User canceled the prompt
//     }

//     try {
//       const response = await fetch(`http://localhost:3000/api/send-tasks`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           recipientEmail,
//           taskIds: selectedTaskIds,
//         }),
//       });

//       if (response.ok) {
//         alert("Tasks sent successfully!");
//       } else {
//         alert("Error sending tasks.");
//         console.error("Error sending tasks:", response.statusText);
//       }
//     } catch (error) {
//       alert("Error sending tasks.");
//       console.error("Error sending tasks:", error);
//     }
//   };
//   return (
//     <>
//       <Sidebar />
//       <button onClick={() => setShowForm(true)}>Add Task</button>
//       <button onClick={handleDownload}>Download Excel</button>
//       <input type="file" accept=".xlsx" onChange={handleFileUpload} />
//       <button onClick={handleDownloadPDF}>Download PDF</button>
//       <button
//         onClick={handleDeleteSelectedTasks}
//         disabled={!selectedTasks.length}
//       >
//         Delete Selected Tasks
//       </button>
//       <button onClick={handleSendMail} disabled={!selectedTasks.length}>
//         Send Mail
//       </button>
//       <div>
//         <label>
//           Filter by:
//           <select value={filterType} onChange={handleFilterChange}>
//             <option value="taskId">Task ID</option>
//             <option value="completionStatus">Completion Status</option>
//           </select>
//         </label>
//         {filterType !== "taskId" && (
//           <select value={filterValue} onChange={handleFilterValueChange}>
//             <option value="completed">Completed</option>
//             <option value="progress">Progress</option>
//             <option value="issue">Issue</option>
//           </select>
//         )}
//         {filterType === "taskId" && (
//           <input
//             type="text"
//             value={filterValue}
//             onChange={handleFilterValueChange}
//           />
//         )}
//       </div>
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
//         <button onClick={fetchData}>Reload Tasks</button>
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
//             {filteredTasks.map((task) => (
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

//=========================================================================================welcode
function Welcome({ userDetails }) {
  // Check if userDetails and userDetails.user.tasks exist
  if (!userDetails || !userDetails.user || !userDetails.user.tasks) {
    return null; // Or display a loading state or an error message
  }

  const totalTasks = userDetails.user.tasks.length;
  const inProgressTasks = userDetails.user.tasks.filter(
    (task) => task.completionStatus === "In Progress"
  ).length;
  const completedTasks = userDetails.user.tasks.filter(
    (task) => task.completionStatus === "Completed"
  ).length;
  const issueTasks = userDetails.user.tasks.filter(
    (task) => task.completionStatus === "Issue"
  ).length;

  // ... (rest of your component code)

  return (
    <div className="welcome">
      {/* ... */}
      <div className="col-md-3">
        <div className="card card-one">
          <div className="text">
            Last 2 Days
            <h1>{totalTasks}</h1>
            <p>+10%</p>
          </div>
          <div className="rotated-card">
            <div className="rotate-text">Total Tasks</div>
          </div>
        </div>
      </div>
      {/* ... (rest of your component code) */}
    </div>
  );
}

export default Welcome;
