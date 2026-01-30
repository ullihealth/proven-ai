import { Navigate } from "react-router-dom";

// This page now redirects to Dashboard
const Index = () => {
  return <Navigate to="/" replace />;
};

export default Index;
