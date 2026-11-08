import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { useStateContext } from "../../context/StateContext";

const Login = () => {
    const router = useRouter();

    const { loginUser } = useStateContext();

    const [UserName, setUserName] = useState("");
    const [Password, setPassword] = useState("");

    const [loading, setLoading] = useState(false);


    // =====================================================
    // LOGIN
    // =====================================================

    const handleLogin = async (e) => {

        e.preventDefault();

        if (!UserName.trim()) {
            toast.error("Please enter username");
            return;
        }

        if (!Password) {
            toast.error("Please enter password");
            return;
        }

        try {

            setLoading(true);

            const response = await fetch("/api/login", {
                method: "POST",

                headers: {
                    "Content-Type": "application/json",
                },

                body: JSON.stringify({
                    UserName: UserName.trim(),
                    Password,
                }),
            });


            const data = await response.json();


            // =====================================================
            // LOGIN FAILED
            // =====================================================

            if (!response.ok) {

                toast.error(
                    data.message || "Invalid username or password"
                );

                return;
            }


            // =====================================================
            // USER IS INACTIVE
            // =====================================================

            if (data.inactive) {

                toast.error("This user account is inactive");

                return;
            }


            // =====================================================
            // LOGIN SUCCESSFUL
            // =====================================================

            loginUser(data);

            toast.success(`Welcome ${data.FullName}`);


            // =====================================================
            // GO TO FIRST PAGE
            // =====================================================

            router.replace("/");

        } catch (error) {

            console.error("Login error:", error);

            toast.error("Unable to connect to the server");

        } finally {

            setLoading(false);
        }
    };


    // =====================================================
    // LOGIN SCREEN
    // =====================================================

    return (
        <div className="login-container">

            <div className="login-box">

                <h1>Shiny Skin Clinic</h1>

                <p className="login-title">
                    Please login to continue
                </p>


                <form onSubmit={handleLogin}>

                    <div className="form-group">

                        <label>
                            Username
                        </label>

                        <input
                            type="text"
                            value={UserName}
                            onChange={(e) =>
                                setUserName(e.target.value)
                            }
                            placeholder="Enter username"
                            autoComplete="username"
                            disabled={loading}
                        />

                    </div>


                    <div className="form-group">

                        <label>
                            Password
                        </label>

                        <input
                            type="password"
                            value={Password}
                            onChange={(e) =>
                                setPassword(e.target.value)
                            }
                            placeholder="Enter password"
                            autoComplete="current-password"
                            disabled={loading}
                        />

                    </div>


                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >

                        {loading
                            ? "Logging in..."
                            : "Login"
                        }

                    </button>

                </form>

            </div>

        </div>
    );
}

//Login.noLayout = true;

export default Login;