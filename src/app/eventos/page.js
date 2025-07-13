

"use client";
export const dynamic = 'force-dynamic';
import React, { useEffect, useState } from 'react';

import { collection, getDocs, addDoc, serverTimestamp, query, where, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useRouter } from 'next/navigation';


const injectGlobalStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
};

injectGlobalStyles();

const EventosPage = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [eventos, setEventos] = useState([]);
    const [eventosFiltrados, setEventosFiltrados] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState(null);
    const [disponibilidade, setDisponibilidade] = useState({});
    const [salvando, setSalvando] = useState(false);
    const [respostasExistentes, setRespostasExistentes] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [salvoComSucesso, setSalvoComSucesso] = useState(false);
    const [mesesDisponiveis, setMesesDisponiveis] = useState([]);
    const [mesSelecionado, setMesSelecionado] = useState('');

    useEffect(() => {
        // Injetar estilos globais apenas no lado do cliente
        if (typeof document !== 'undefined') {
            const style = document.createElement('style');
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);

            return () => {
                document.head.removeChild(style);
            };
        }
    }, []);

    useEffect(() => {
        // Mova TODA a lógica que depende do browser para este useEffect
        if (typeof window !== 'undefined' && typeof document !== 'undefined') {
            // 1. Verificação do usuário
            const userData = JSON.parse(localStorage.getItem('user'));
            if (!userData) {
                router.push('/login');
                return;
            }
            setUser(userData);

            // 2. Injeção de estilos (se realmente necessário)
            const style = document.createElement('style');
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);

            return () => {
                document.head.removeChild(style);
            };
        }
    }, [router]);


    useEffect(() => {
        const fetchEventos = async () => {
            try {
                const snapshot = await getDocs(collection(db, 'eventos'));
                const eventosData = snapshot.docs.map(doc => {
                    const data = doc.data();
                    const date = data.date?.toDate ? data.date.toDate() : new Date();

                    return {
                        id: doc.id,
                        ...data,
                        rawDate: date,
                        date: date.toLocaleDateString('pt-BR', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        }),
                        mesAno: `${date.getMonth()}-${date.getFullYear()}`,
                        nomeMes: date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                    };
                });

                const mesesUnicos = [...new Set(
                    eventosData.map(evento => evento.mesAno)
                )].map(mesAno => {
                    const [mes, ano] = mesAno.split('-');
                    return {
                        valor: mesAno,
                        label: new Date(ano, mes).toLocaleDateString('pt-BR', {
                            month: 'long',
                            year: 'numeric'
                        })
                    };
                });

                setMesesDisponiveis(mesesUnicos);
                eventosData.sort((a, b) => a.rawDate - b.rawDate);
                setEventos(eventosData);
                setEventosFiltrados(eventosData);

                if (mesesUnicos.length === 1) {
                    setMesSelecionado(mesesUnicos[0].valor);
                }

            } catch (error) {
                console.error('Erro ao buscar eventos:', error);
            }
        };

        const fetchRespostasExistentes = async () => {
            if (!user?.user_id) return;

            try {
                const q = query(
                    collection(db, 'disponibilidades'),
                    where('musicoId', '==', user.user_id)
                );
                const snapshot = await getDocs(q);
                const respostas = {};
                snapshot.forEach(docSnap => {
                    const data = docSnap.data();
                    respostas[data.eventoId] = {
                        idDoc: docSnap.id,
                        status: data.status
                    };
                });
                setRespostasExistentes(respostas);
                setDisponibilidade(
                    Object.fromEntries(
                        Object.entries(respostas).map(([eventoId, { status }]) => [eventoId, status])
                    )
                );
            } catch (error) {
                console.error('Erro ao buscar respostas existentes:', error);
            }
        };

        if (user) {
            fetchEventos();
            fetchRespostasExistentes();
        }
    }, [user?.user_id]);

    useEffect(() => {
        if (mesSelecionado) {
            const filtrados = eventos.filter(evento => evento.mesAno === mesSelecionado);
            setEventosFiltrados(filtrados);
        } else {
            setEventosFiltrados(eventos);
        }
    }, [mesSelecionado, eventos]);

    const handleEventoClick = (id) => {
        setSelectedEventId(id === selectedEventId ? null : id);
    };

    const handleEscolha = (id, escolha) => {
        setDisponibilidade(prev => ({ ...prev, [id]: escolha }));
        setSelectedEventId(null);
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/login');
    };

    const handleSalvar = async () => {
        if (!user) return;

        setSalvando(true);
        setShowModal(true);
        setSalvoComSucesso(false);

        try {
            for (const eventoId in disponibilidade) {
                const status = disponibilidade[eventoId];

                if (respostasExistentes[eventoId]) {
                    const docRef = doc(db, 'disponibilidades', respostasExistentes[eventoId].idDoc);
                    await updateDoc(docRef, {
                        status,
                        timestamp: serverTimestamp(),
                    });
                } else {
                    const docRef = await addDoc(collection(db, 'disponibilidades'), {
                        eventoId,
                        musicoId: user.user_id,
                        status,
                        timestamp: serverTimestamp(),
                    });

                    setRespostasExistentes(prev => ({
                        ...prev,
                        [eventoId]: {
                            idDoc: docRef.id,
                            status,
                        }
                    }));
                }
            }

            setSalvoComSucesso(true);
            setTimeout(() => {
                setShowModal(false);
                setSalvando(false);
            }, 2000);

        } catch (error) {
            console.error('Erro ao salvar disponibilidades:', error);
            setShowModal(false);
            setSalvando(false);
            alert('Erro ao salvar disponibilidades.');
        }
    };

    const hasDisponibilidade = Object.keys(disponibilidade).length > 0;

    if (!user) return <p style={styles.centerText}>Carregando...</p>;

    return (
        <>
            {showModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        {salvoComSucesso ? (
                            <>
                                <div style={styles.successIcon}>✓</div>
                                <p style={styles.successMessage}>Salvo com sucesso!</p>
                            </>
                        ) : (
                            <>
                                <div style={styles.spinner}></div>
                                <p>Salvando suas disponibilidades...</p>
                            </>
                        )}
                    </div>
                </div>
            )}

            {hasDisponibilidade && (
                <button
                    onClick={handleSalvar}
                    disabled={salvando}
                    style={styles.fab}
                    title="Salvar disponibilidades"
                >
                    {salvando ? '...' : '💾'}
                </button>
            )}

            <div style={styles.appBar}>
                <div
                    style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: '#6f68dd',
                        color: 'white',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        fontWeight: 'bold',
                        fontSize: '18px',
                        overflow: 'hidden',
                    }}
                >
                    {user.photoUrl ? (
                        <img
                            src={user.photoUrl}
                            alt="Foto do usuário"
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                        />
                    ) : (
                        user.name.charAt(0).toUpperCase()
                    )}
                </div>

                <div style={styles.userName}>{user.name}</div>

                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    gap: '10px',
                    maxWidth: '240px'
                }}>
                    <button
                        onClick={() => router.push('/')}
                        className={styles.faqButton}
                        style={{
                            flex: 1,
                            padding: '10px',
                            fontSize: '16px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: '6px',
                            backgroundColor: 'black',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        Playlist
                    </button>

                    <button
                        onClick={handleLogout}
                        className={styles.logoutButton}
                        title="Logout"
                        style={{
                            flex: 1,
                            padding: '10px',
                            fontSize: '16px',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            borderRadius: '6px',
                            backgroundColor: 'black',
                            color: 'white',
                            border: 'none',
                            cursor: 'pointer'
                        }}
                    >
                        🔒
                    </button>
                </div>




            </div>


            <div style={styles.container}>
                {mesesDisponiveis.length > 0 && (
                    <div style={styles.dropdownContainer}>
                        <select
                            value={mesSelecionado}
                            onChange={(e) => setMesSelecionado(e.target.value)}
                            style={styles.dropdown}
                        >
                            <option value="">Todos os meses</option>
                            {mesesDisponiveis.map(mes => (
                                <option key={mes.valor} value={mes.valor}>
                                    {mes.label}
                                </option>
                            ))}
                        </select>
                    </div>
                )}

                <h3 style={{ fontSize: '20px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    Eventos disponíveis{' '}
                    <span
                        style={{
                            backgroundColor: '#6f68dd',
                            color: 'white',
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '14px',
                            fontWeight: 'bold',
                            display: 'inline-block',
                            minWidth: '28px',
                            textAlign: 'center',
                        }}
                    >
                        {eventosFiltrados.length}
                    </span>
                </h3>


                <ul style={styles.eventList}>
                    {eventosFiltrados.map(evento => (
                        <li key={evento.id} style={styles.eventCard}>
                            <div style={styles.eventTitle}>
                                <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{evento.name}</span><br />
                                <small style={{ color: '#666' }}>{evento.date}</small>
                            </div>

                            <div style={styles.choiceContainer}>
                                <div style={styles.buttonGroup}>
                                    <button
                                        onClick={() => handleEscolha(evento.id, 'disponivel')}
                                        style={{
                                            ...styles.buttonYes,
                                            ...(disponibilidade[evento.id] === 'disponivel' ? styles.selectedYes : {}),
                                        }}
                                    >
                                        ✅ Disponível
                                    </button>
                                    <button
                                        onClick={() => handleEscolha(evento.id, 'indisponivel')}
                                        style={{
                                            ...styles.buttonNo,
                                            ...(disponibilidade[evento.id] === 'indisponivel' ? styles.selectedNo : {}),
                                        }}
                                    >
                                        ❌ Indisponível
                                    </button>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </>
    );
}

const styles = {
    appBar: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 20px',
        backgroundColor: 'black',
        color: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
    },
    avatar: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#483D8B',
        color: 'white',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontWeight: 'bold',
        fontSize: '18px',
        userSelect: 'none',
    },
    userName: {
        flexGrow: 1,
        marginLeft: '15px',
        fontWeight: '600',
        fontSize: '18px',
    },
    logoutButton: {
        backgroundColor: 'transparent',
        border: '1.5px solid white',
        borderRadius: '8px',
        color: 'white',
        padding: '6px 12px',
        cursor: 'pointer',
        fontWeight: '600',
        transition: 'background-color 0.3s ease',
    },
    container: {
        padding: '16px',
        paddingBottom: '100px',
        maxWidth: '600px',
        margin: '0 auto',
        fontFamily: 'Arial, sans-serif',
    },
    dropdownContainer: {
        marginBottom: '20px',
    },
    dropdown: {
        width: '100%',
        padding: '10px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        fontSize: '16px',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    subHeader: {
        fontSize: '18px',
        color: '#555',
        marginBottom: '16px',
    },
    eventCountBadge: {
        backgroundColor: 'black',
        color: 'white',
        borderRadius: '50%',
        padding: '6px 6px',
        fontSize: '8',
        fontWeight: 'bold',
        minWidth: '20px',
        height: '20px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
    },
    eventList: {
        listStyle: 'none',
        padding: 0,
    },
    eventCard: {
        backgroundColor: 'white',
        padding: '16px',
        borderRadius: '12px',
        marginBottom: '12px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    },
    eventTitle: {
        cursor: 'pointer',
    },
    choiceContainer: {
        marginTop: '12px',
    },
    buttonGroup: {
        display: 'flex',
        justifyContent: 'space-between',
        gap: '12px',
    },
    buttonYes: {
        backgroundColor: '#fff',
        color: '#4CAF50',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 16px',
        cursor: 'pointer',
        transition: 'all 0.3s',
        flex: '1 1 0',
        maxWidth: '150px',
        minWidth: '120px',
        textAlign: 'center',
    },
    buttonNo: {
        backgroundColor: '#fff',
        color: '#f44336',
        border: 'none',
        borderRadius: '8px',
        padding: '10px 16px',
        cursor: 'pointer',
        transition: 'all 0.3s',
        flex: '1 1 0',
        maxWidth: '150px',
        minWidth: '120px',
        textAlign: 'center',
    },
    selectedYes: {
        border: '2px solid #4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
    },
    selectedNo: {
        border: '2px solid #f44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
    },
    modalContent: {
        backgroundColor: 'white',
        padding: '30px',
        borderRadius: '12px',
        textAlign: 'center',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
        maxWidth: '300px',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    successIcon: {
        fontSize: '40px',
        color: '#4CAF50',
        marginBottom: '15px',
    },
    successMessage: {
        color: '#4CAF50',
        fontWeight: 'bold',
        fontSize: '18px',
    },
    spinner: {
        border: '4px solid rgba(0, 0, 0, 0.1)',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        borderLeftColor: '#09f',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 20px',
    },
    fab: {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        backgroundColor: 'black',
        color: '#fff',
        border: 'none',
        borderRadius: '50%',
        width: '60px',
        height: '60px',
        fontSize: '24px',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        zIndex: 999,
    },
    centerText: {
        textAlign: 'center',
        marginTop: '40px',
        fontSize: '18px',
    },
};

export default EventosPage;