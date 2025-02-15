import { Routes, Route } from 'react-router-dom'
import Chat from './Chat'
import Home from './Home'
import ChatWindow from '../components/ChatWindow'
import Navbar from '../components/Navbar';
import Settings from './Settings'

const Dashboard = () => {
    
    return (
        <div className="min-h-screen">
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/new-chat" element={<ChatWindow />} />
                <Route path="/settings" element={<Settings />} />
            </Routes>
        </div>
    )
}

export default Dashboard;