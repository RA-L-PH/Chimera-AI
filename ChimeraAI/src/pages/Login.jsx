import AuthForm from '../components/AuthForm';

const Login = () => {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <AuthForm />
      </div>
    </div>
  );
};


export default Login;