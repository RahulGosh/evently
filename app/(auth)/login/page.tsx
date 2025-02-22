import { LoginForm } from "@/components/auth/loginForm";
import { Suspense } from "react";

const LoginPage = () => {
  return (
    <Suspense fallback={<p>Loading....</p>}>
      <LoginForm />
    </Suspense>
  );
};

export default LoginPage;
