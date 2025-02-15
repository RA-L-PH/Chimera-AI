import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import About from './pages/About';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import { Toaster } from 'react-hot-toast';
import "./App.css"

const App = () => {
  return (
    <>
      <Toaster />
      <Router>
        <Routes>
          <Route path="/" element={<About />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="/login" element={<Login/>} />
          <Route path="/not-found" element={<NotFound />} />
        </Routes>
      </Router>
    </>
  );
};

export default App;