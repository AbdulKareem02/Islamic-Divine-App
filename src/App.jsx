import IslamicHome from "./components/Home/home";
import "./App.css";
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<IslamicHome />} />
      </Routes>
    </>
  );
}

export default App;
