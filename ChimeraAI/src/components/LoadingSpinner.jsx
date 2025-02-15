const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <div className="relative w-12 h-12">
        {/* Outer spinning ring */}
        <div className="absolute w-full h-full border-4 border-gray-200 rounded-full"></div>
        
        {/* Inner spinning gradient ring */}
        <div className="absolute w-full h-full border-4 border-transparent border-t-blue-500 rounded-full animate-spin"></div>
        
        {/* Optional: Inner pulsing dot */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        </div>
      </div>
      
      {/* Optional loading message */}
      {message && (
        <p className="mt-4 text-gray-600 text-sm font-medium animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;