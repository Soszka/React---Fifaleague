// src/AppRoutes.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/auth/Auth";
import Navigation from "./pages/navigation/Navigation";
import Home from "./pages/home/Home";
import TablePage from "./pages/table/Table";
import RankingPage from "./pages/ranking/Ranking";
import TeamsPage from "./pages/teams/Teams";
import MatchesTable from "./pages/matches/Matches";
import StatsPage from "./pages/stats/Stats";
import AboutPage from "./pages/about/About";

interface Props {
  toggleTheme: () => void;
}

export function AppRoutes({ toggleTheme }: Props) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/auth" replace />} />

      <Route path="/auth/*" element={<Auth />} />

      <Route path="/app/*" element={<Navigation toggleTheme={toggleTheme} />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<Home />} />
        <Route path="table" element={<TablePage />} />
        <Route path="ranking" element={<RankingPage />} />
        <Route path="teams" element={<TeamsPage />} />
        <Route path="matches" element={<MatchesTable />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="about" element={<AboutPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
