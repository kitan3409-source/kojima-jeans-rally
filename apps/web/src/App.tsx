import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import TopPage from "./pages/TopPage";
import MyStampsPage from "./pages/MyStampsPage";
import ScanPage from "./pages/ScanPage";
import CompletePage from "./pages/CompletePage";
import AdminPage from "./pages/AdminPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<TopPage />} />
          <Route path="/stamps" element={<MyStampsPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/complete" element={<CompletePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
