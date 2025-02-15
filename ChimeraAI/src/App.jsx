import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import About from './pages/About';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
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
        </Routes>
      </Router>
    </>
  );
};

export default App;