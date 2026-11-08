import { useState } from "react";
import { useStateContext } from "../../../context/StateContext";

const LoginPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");

  const { setUserInfo } = useStateContext(); // ✅ get global function

  const submitHandler = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message);

      localStorage.setItem("userInfo", JSON.stringify(data));

      setUserInfo(data); // ✅ instantly updates navbar

      alert("Login successful!");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Login</h1>
      <form className="form-container" onSubmit={submitHandler}>
        <input  className="form-field"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input className="form-field"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="btn" type="submit">Sign In</button>
      </form>
    </div>
  );
};

export default LoginPage;
