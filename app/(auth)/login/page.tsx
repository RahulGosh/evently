import { LoginForm } from "@/components/auth/loginForm";
import LoadingLogo from "@/components/shared/loadingLogo";
import { Suspense } from "react";

const LoginPage = () => {
  return (
    <Suspense fallback={<LoadingLogo />}>
      <LoginForm />
    </Suspense>
  );
};

export default LoginPage;
