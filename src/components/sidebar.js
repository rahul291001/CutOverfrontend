import React from "react";
import { Link } from "react-router-dom";

import "../Styles/sidebar.css";
import { IoSpeedometerSharp } from "react-icons/io5";
import { AiOutlineMenu, AiOutlineLogout } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { FaSave } from "react-icons/fa";
function Sidebar() {
  const navigate = useNavigate();
  const handleLogout = () => {
    navigate("/");
  };
  return (
    <div className="Sidebar">
      <Link to="/welcome">
        <div>
          <IoSpeedometerSharp className="icon-svg" />
        </div>
      </Link>
      <Link to="/tasktable">
        <AiOutlineMenu className="icon-svg1" />
      </Link>

      <Link to="/save">
        <div className="icon-save">
          <FaSave className="icon-svg4" />
        </div>
      </Link>
      <AiOutlineLogout className="icon-svg3" onClick={handleLogout} />
    </div>
  );
}

export default Sidebar;
