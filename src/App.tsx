import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Cidades from "./pages/Cidades";
import Escolas from "./pages/Escolas";
import Turmas from "./pages/Turmas";
import Supervisores from "./pages/Supervisores";

function App() {
  return (
<BrowserRouter basename={import.meta.env.BASE_URL}>      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cidades" element={<Cidades />} />
        <Route path="/escolas" element={<Escolas />} />
        <Route path="/turmas" element={<Turmas />} />
        <Route path="/supervisores" element={<Supervisores />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;