import { LoginPage } from "../LoginPage";

export default function LoginPageExample() {
  return <LoginPage onLogin={() => console.log("Login successful")} />;
}
