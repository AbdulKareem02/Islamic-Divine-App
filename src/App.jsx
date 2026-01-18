import IslamicHome from "./components/Home/home";
import "./App.css";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<IslamicHome />} />
      </Routes>
    </div>
  );
}

export default App;
