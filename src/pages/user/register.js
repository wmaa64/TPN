import { useState } from "react";
import { useStateContext } from "../../../context/StateContext";

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    isSeller: false,
    isAdmin: false,
  });

  const { setUserInfo } = useStateContext(); // ✅ get global function

  // 🔹 Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  // 🔹 Submit registration
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");

      localStorage.setItem("userInfo", JSON.stringify(data));
      setUserInfo(data); // ✅ instantly updates navbar
      
      alert("🎉 Registration successful!");
      setFormData({
        name: "",
        email: "",
        mobile: "",
        password: "",
        isSeller: false,
        isAdmin: false,
      });
    } catch (error) {
      alert("❌ " + error.message);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>Register</h1>

      <form className="form-container" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input  className="form-field"
          type="text"
          name="name"
          placeholder="Enter name"
          value={formData.name}
          onChange={handleChange}
          required
        />

        <input className="form-field"
          type="email"
          name="email"
          placeholder="Enter email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input className="form-field"
          type="text"
          name="mobile"
          placeholder="Enter mobile number"
          value={formData.mobile}
          onChange={handleChange}
          required
        />

        <input className="form-field"
          type="password"
          name="password"
          placeholder="Enter password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <label  className="form-field">
          <input  
            type="checkbox"
            name="isSeller"
            checked={formData.isSeller}
            onChange={handleChange}
            value="false"
            disabled="true"
          />{" "}
          Seller Account
        </label>

        <label  className="form-field">
          <input  
            type="checkbox"
            name="isAdmin"
            checked={formData.isAdmin}
            onChange={handleChange}
            value="false"
            disabled="true"
          />{" "}
          Admin Account
        </label>

        <button className="btn" type="submit">Register</button>
      </form>
    </div>
  );
};

export default RegisterPage;
