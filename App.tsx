import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Database from './pages/Database';
import AddSong from './pages/AddSong';
import SongDetail from './pages/SongDetail';
import Interactive from './pages/Interactive';
import About from './pages/About';
import Streaming from './pages/Streaming';
import AdminDashboard from './pages/AdminDashboard';
import Guestbook from './pages/Guestbook';
import ChatWidget from './components/ChatWidget';
import { DataProvider } from './context/DataContext';
import { UserProvider } from './context/UserContext';
import { LanguageProvider } from './context/LanguageContext';
import { ToastProvider } from './context/ToastContext';

const App: React.FC = () => {
  return (
    <ToastProvider>
      <LanguageProvider>
        <UserProvider>
            <DataProvider>
                <HashRouter>
                <Layout>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/database" element={<Database />} />
                      <Route path="/add" element={<AddSong />} />
                      <Route path="/song/:id" element={<SongDetail />} />
                      <Route path="/interactive" element={<Interactive />} />
                      <Route path="/streaming" element={<Streaming />} />
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/guestbook" element={<Guestbook />} />
                    </Routes>
                </Layout>
                </HashRouter>
            </DataProvider>
        </UserProvider>
      </LanguageProvider>
    </ToastProvider>
  );
};

export default App;