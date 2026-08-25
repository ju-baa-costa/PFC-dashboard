import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Cidades from "./pages/Cidades";
import Escolas from "./pages/Escolas";
import Turmas from "./pages/Turmas";
import TurmaDetalhe from "./pages/TurmaDetalhe";
import Supervisores from "./pages/Supervisores";
import Cursinho from "./pages/Cursinho";
import ProjetoDeVida from "./pages/ProjetoDeVida";

function App() {
  return (
<BrowserRouter basename={import.meta.env.BASE_URL}>      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/cidades" element={<Cidades />} />
        <Route path="/escolas" element={<Escolas />} />
        <Route path="/turmas" element={<Turmas />} />
        <Route path="/turmas/:codigo" element={<TurmaDetalhe />} />
        <Route path="/supervisores" element={<Supervisores />} />
        <Route path="/cursinho" element={<Cursinho />} />
        <Route path="/projeto-de-vida" element={<ProjetoDeVida />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;