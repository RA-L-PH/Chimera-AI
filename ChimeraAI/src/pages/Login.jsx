import AuthForm from '../components/AuthForm';
import { useNavigate } from 'react-router-dom';
import { IoArrowBack } from 'react-icons/io5';

const Login = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-950 relative">
      <button
        onClick={handleBack}
        className="absolute top-4 left-4 text-white hover:text-gray-300 p-2 rounded-full transition-colors duration-200 flex items-center gap-2"
        aria-label="Go back"
      >
        <IoArrowBack size={24} />
      </button>
      <div className="flex items-center justify-center p-8 sm:p-4 min-h-screen">
        <div className="w-full max-w-md sm:max-w-[320px]">
          <AuthForm />
        </div>
      </div>
    </div>
  );
};

export default Login;