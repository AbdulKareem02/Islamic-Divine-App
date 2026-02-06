import IslamicHome from "./components/Home/home";
import "./App.css";
import { Routes, Route } from "react-router-dom";
import Tasbeeh from "./components/Tasbeeh/tasbeeh";
import Calendar from "./components/Calender/calenderPage";

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<IslamicHome />} />
        <Route path="/tasbeeh" element={<Tasbeeh />} />
        <Route path="/calender" element={<Calendar />} />
      </Routes>
    </div>
  );
}

export default App;
