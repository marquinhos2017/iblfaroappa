"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import styles from "./login.module.css";
import { FiLogIn, FiMail, FiLock, FiUserPlus, FiLoader } from "react-icons/fi";
import Image from "next/image";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            if (email === "admin@admin.com" && password === "admin") {
                const userData = {
                    name: "Admin",
                    user_id: "admin-id",
                    email: "admin@admin.com",
                    role: "admin",
                };

                localStorage.setItem("authToken", "admin-token");
                localStorage.setItem("user", JSON.stringify(userData));
                router.push("/admin");
                return;
            }

            const q = query(
                collection(db, "musicos"),
                where("email", "==", email),
                where("password", "==", password)
            );
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError("Email ou senha incorretos");
                return;
            }

            const userDoc = querySnapshot.docs[0];
            const userData = {
                id: userDoc.id,
                ...userDoc.data(),
                role: "user",
            };

            localStorage.setItem("authToken", "user-token");
            localStorage.setItem("user", JSON.stringify(userData));

            router.push("/eventos").then(() => {
                window.location.reload();
            });
        } catch (error) {
            console.error("Erro no login:", error);
            setError("Erro ao fazer login. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAccount = () => {
        router.push("/criar-conta");
    };

    return (
        <div className={styles.page}>
            <div className={styles.background} />

            <div className={styles.container}>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: "20px" }}>
                    <Image
                        src="/assets/LOGO1.png"
                        alt="Logo"
                        width={600}
                        height={150}
                        style={{ width: "300px", height: "75px" }}
                    />
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <form className={styles.form} onSubmit={handleLogin}>
                    <div className={styles.inputWrapper}>
                        <FiMail className={styles.iconInput} />
                        <input
                            type="email"
                            placeholder="E-mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className={styles.input}
                            disabled={loading}
                        />
                    </div>

                    <div className={styles.inputWrapper}>
                        <FiLock className={styles.iconInput} />
                        <input
                            type="password"
                            placeholder="Senha"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className={styles.input}
                            disabled={loading}
                        />
                    </div>

                    <div className={styles.formButtons}>
                        <button type="submit" className={styles.button} disabled={loading}>
                            {loading ? (
                                <>
                                    <FiLoader className={`${styles.icon} ${styles.spin}`} />
                                    Carregando...
                                </>
                            ) : (
                                <>
                                    <FiLogIn className={styles.icon} />
                                    Entrar
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            className={styles.createAccountButton}
                            onClick={handleCreateAccount}
                        >
                            <FiUserPlus className={styles.icon} />
                            Criar conta
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
