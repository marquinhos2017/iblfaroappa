"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import styles from './login.module.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const router = useRouter();

    // No topo do componente, antes do return
    const bubbles = new Array(20).fill(null).map((_, index) => {
        const left = Math.random() * 100; // % da tela
        const size = Math.random() * 20 + 10; // tamanho entre 10px e 30px
        const duration = Math.random() * 10 + 5; // duração entre 5s e 15s
        const delay = Math.random() * 10; // atraso entre 0 e 10s

        return (
            <span
                key={index}
                className={styles.bubble}
                style={{
                    left: `${left}%`,
                    width: `${size}px`,
                    height: `${size}px`,
                    animationDuration: `${duration}s`,
                    animationDelay: `${delay}s`,
                }}
            />
        );
    });


    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Login admin
            if (email === 'admin@admin' && password === 'admin') {
                const userData = {
                    name: 'Admin',
                    user_id: 'admin-id',
                    email: 'admin@admin',
                    role: 'admin'
                };
                // Armazena tanto user quanto authToken
                localStorage.setItem('authToken', 'admin-token');
                localStorage.setItem('user', JSON.stringify(userData));

                // Força recarregamento completo
                window.location.href = '/admin';
                return;
            }

            // Verificação no Firebase
            const q = query(
                collection(db, 'musicos'),
                where('email', '==', email),
                where('password', '==', password)
            );
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                setError('Email ou senha incorretos');
                return;
            }

            const userDoc = querySnapshot.docs[0];
            const userData = {
                id: userDoc.id,
                ...userDoc.data(),
                role: 'user' // Adiciona role padrão
            };

            // Armazena ambos os itens necessários
            localStorage.setItem('authToken', 'user-token'); // Token genérico
            localStorage.setItem('user', JSON.stringify(userData));

            // Redirecionamento forçado com recarregamento
            window.location.href = '/eventos';

        } catch (error) {
            console.error('Erro no login:', error);
            setError('Erro ao fazer login. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (

        <div className={styles.page}>
            <div className={styles.container}>
                <div className={styles.logo}>IBL Faro Music</div>

                {error && <div className={styles.error}>{error}</div>}

                <form className={styles.form} onSubmit={handleLogin}>
                    <input
                        type="email"
                        placeholder="E-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className={styles.input}
                        disabled={loading}
                    />
                    <input
                        type="password"
                        placeholder="Senha"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className={styles.input}
                        disabled={loading}
                    />
                    <button
                        type="submit"
                        className={styles.button}
                        disabled={loading}
                    >
                        {loading ? 'Carregando...' : 'Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
}