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

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            // Login admin - ATUALIZADO para admin@admin.com
            if (email === 'admin@admin.com' && password === 'admin') {
                const userData = {
                    name: 'Admin',
                    user_id: 'admin-id',
                    email: 'admin@admin.com',
                    role: 'admin'
                };

                localStorage.setItem('authToken', 'admin-token');
                localStorage.setItem('user', JSON.stringify(userData));

                // Usar router.push em vez de window.location.href
                router.push('/admin');
                return;
            }

            // Verificação no Firebase para usuários normais
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
                role: 'user'
            };

            localStorage.setItem('authToken', 'user-token');
            localStorage.setItem('user', JSON.stringify(userData));

            router.push('/eventos');

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