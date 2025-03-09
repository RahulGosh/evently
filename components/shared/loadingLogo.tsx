const LoadingLogo = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="flex space-x-2">
        <div className="w-5 h-5 bg-black rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
        <div className="w-5 h-5 bg-black rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
        <div className="w-5 h-5 bg-black rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
      </div>
    </div>
  );
};

export default LoadingLogo;