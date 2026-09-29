import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import TopPage from "./pages/TopPage";
import MyStampsPage from "./pages/MyStampsPage";
import ScanPage from "./pages/ScanPage";
import CompletePage from "./pages/CompletePage";
import AdminPage from "./pages/AdminPage";
import AdminStatsPage from "./pages/AdminStatsPage";
import SpotDetailPage from "./pages/SpotDetailPage";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<TopPage />} />
          <Route path="/stamps" element={<MyStampsPage />} />
          <Route path="/scan" element={<ScanPage />} />
          <Route path="/complete" element={<CompletePage />} />
          <Route path="/spots/:id" element={<SpotDetailPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/stats" element={<AdminStatsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
