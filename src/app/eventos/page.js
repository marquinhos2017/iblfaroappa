"use client";
import React, { useEffect, useState, useRef } from 'react';

import { collection, getDocs, addDoc, serverTimestamp, query, where, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useRouter } from 'next/navigation';
import { FiLogOut, FiTrash2, FiCalendar, FiChevronDown, FiUsers, FiMail, FiPlus, FiAirplay, FiX, FiPackage } from 'react-icons/fi';
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

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



const EventosPage = () => {
    const [showWelcome, setShowWelcome] = useState(true);
    useEffect(() => {
        const timer = setTimeout(() => setShowWelcome(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    async function adicionarEventosDomingosAgosto() {
        const year = 2025;
        const month = 7; // agosto (0-based)

        let domingos = [];

        for (let day = 1; day <= 31; day++) {
            const date = new Date(year, month, day);
            if (date.getMonth() !== month) break;

            if (date.getDay() === 0) { // domingo
                domingos.push(new Date(date)); // copiar a data
            }
        }

        const eventosRef = collection(db, 'eventos');

        for (const domingo of domingos) {
            // Evento 1: 10:00
            const eventoManha = new Date(domingo);
            eventoManha.setHours(10, 0, 0, 0);

            // Evento 2: 19:30
            const eventoNoite = new Date(domingo);
            eventoNoite.setHours(19, 30, 0, 0);

            // Adiciona no Firestore os dois eventos
            await addDoc(eventosRef, {
                name: "Culto de Celebração",
                date: Timestamp.fromDate(eventoManha),
                createdAt: Timestamp.now(),
                dateFormatted: format(eventoManha, "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR }),
            });

            await addDoc(eventosRef, {
                name: "Culto de Celebração",
                date: Timestamp.fromDate(eventoNoite),
                createdAt: Timestamp.now(),
                dateFormatted: format(eventoNoite, "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR }),
            });
        }

        return "Eventos de domingo adicionados com sucesso!";
    }


    async function adicionarEventosQuartasAgosto() {
        const year = 2025;
        const month = 7; // em JS Date, mês é 0-based, agosto = 7

        let quartas = [];

        for (let day = 1; day <= 31; day++) {
            const date = new Date(year, month, day);

            if (date.getMonth() !== month) break;

            if (date.getDay() === 3) { // quarta-feira (domingo=0,...,quarta=3)
                // Setar horário 20:00
                date.setHours(20, 0, 0, 0);
                quartas.push(date);
            }
        }

        const eventosRef = collection(db, 'eventos');

        for (const dataEvento of quartas) {
            await addDoc(eventosRef, {
                name: "Culto Fé",
                date: Timestamp.fromDate(dataEvento),
                createdAt: Timestamp.now(),
                dateFormatted: format(dataEvento, "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR }),
            });
        }

        return 'Eventos adicionados com sucesso!';
    }
    const [mensagem, setMensagem] = useState('');
    async function handleClick() {
        try {
            const resultado = await adicionarEventosQuartasAgosto();
            const a = await adicionarEventosDomingosAgosto();
            setMensagem(resultado);
        } catch (error) {
            setMensagem('Erro: ' + error.message);
        }
    }
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
    const [loadinga, setLoadinga] = useState(true);
    useEffect(() => {
        // Verificar autenticação apenas no cliente
        if (typeof window !== 'undefined') {
            const userData = JSON.parse(localStorage.getItem('user'));
            if (!userData) {
                router.push('/login');
                return;
            }
            setUser(userData);
        }
    }, [router]);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            try {
                setLoadinga(false); // Já existe no seu código
                const startTime = Date.now(); // Marca o início do carregamento
                // Buscar eventos
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

                // Buscar respostas existentes
                const q = query(
                    collection(db, 'disponibilidades'),
                    where('musicoId', '==', user.user_id)
                );
                const respostaSnapshot = await getDocs(q);
                const respostas = {};
                respostaSnapshot.forEach(docSnap => {
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

                const elapsed = Date.now() - startTime;
                const remaining = Math.max(1000 - elapsed, 0);

                setTimeout(() => {
                    setLoading(false);
                    setMinLoadingComplete(true);
                }, remaining);


            } catch (error) {
                console.error('Erro ao buscar dados:', error);
            } finally {
                setLoading(false);
                setLoadinga(false); // Já existe no seu código
                setMinLoadingComplete(true);
            }
        };

        fetchData();
    }, [user]);

    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);

    // Fecha dropdown ao clicar fora
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedLabel = mesSelecionado
        ? mesesDisponiveis.find(m => m.valor === mesSelecionado)?.label
        : 'Todos os meses';
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

    if (loadinga) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner}></div>
                <p style={styles.loadingText}>Carregando eventos...</p>
            </div>
        );
    }


    return (
        <>
            {showWelcome && (
                <div style={{
                    position: 'fixed',
                    bottom: 20,
                    left: 20,
                    backgroundColor: '#0B3D91',
                    color: 'white',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    zIndex: 1000,
                    animation: 'fadeIn 0.5s'
                }}>
                    SUGESTÕES DE MÚSICAS ENCERRADA.
                </div>
            )}
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

            <header style={styles.appBar}>
                <h1 style={styles.title}>
                    <FiAirplay style={styles.titleIcon} />

                </h1>
                {/*
                <div>
                    <button onClick={handleClick}>
                        Adicionar eventos quartas de agosto
                    </button>
                    {mensagem && <p>{mensagem}</p>}
                </div>
                <div>
                    <button onClick={handleClick}>Adicionar eventos domingos de agosto</button>
                    {mensagem && <p>{mensagem}</p>}
                </div>*/}

                <div style={styles.headerActions}>
                    <div style={styles.userBadge}>
                        <div style={styles.avatar}>
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>{user.name}</div>
                    </div>

                    {/*                    <button
                        onClick={() => router.push('/')}
                        title="Playlist"
                        style={styles.iconButton}
                    >
                        <FiPlus size={20} />
                    </button>
                    */
                    }

                    <button
                        onClick={handleLogout}
                        title="Logout"
                        style={styles.iconButton}
                    >
                        <FiLogOut size={20} />
                    </button>
                </div>
            </header>



            <div style={styles.container}>
                {mesesDisponiveis.length > 0 && (
                    <div style={styles.dropdownContainer} ref={containerRef}>
                        <div style={styles.dropdownHeader} onClick={() => setOpen(!open)}>
                            {selectedLabel}
                            <span style={styles.arrow}>{open ? '▲' : '▼'}</span>
                        </div>
                        {open && (
                            <div style={styles.dropdownList}>
                                <div
                                    style={mesSelecionado === '' ? styles.dropdownItemSelected : styles.dropdownItem}
                                    onClick={() => {
                                        setMesSelecionado('');
                                        setOpen(false);
                                    }}
                                >
                                    Todos os meses
                                </div>
                                {mesesDisponiveis.map((mes) => (
                                    <div
                                        key={mes.valor}
                                        style={mesSelecionado === mes.valor ? styles.dropdownItemSelected : styles.dropdownItem}
                                        onClick={() => {
                                            setMesSelecionado(mes.valor);
                                            setOpen(false);
                                        }}
                                    >
                                        {mes.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <h3 style={styles.subHeader}>
                    Eventos disponíveis{' '}
                    <span style={styles.eventCountBadge}>
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
        padding: '0',              // Remover padding, vamos controlar tamanho via width/height
        fontSize: '12px',          // Ajuste para um tamanho legível (você usava '8', sem unidade)
        fontWeight: 'bold',
        minWidth: '20px',          // largura mínima
        height: '20px',            // altura fixa para círculo
        width: '20px',             // largura fixa igual à altura para círculo perfeito
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        userSelect: 'none',        // evita seleção do número ao clicar
    }
    ,
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

    loadingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: '20px',
        fontSize: '18px',
        color: '#555',
    },
    spinner: {
        border: '4px solid rgba(0, 0, 0, 0.1)',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        borderLeftColor: '#09f',
        animation: 'spin 1s linear infinite',
    },
    // ... outros estilos ...
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
    title: {
        display: 'flex',
        alignItems: 'center',
        fontSize: '20px',
        gap: '10px',
    },
    titleIcon: {
        fontSize: '24px',
    },
    headerActions: {
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    iconButton: {
        padding: '8px 10px',
        borderRadius: '6px',
        backgroundColor: '#000',
        color: '#fff',
        border: '1px solid #fff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    userBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginRight: '10px',
    },
    avatar: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: '#f6f6f8',
        color: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
    },

    dropdownContainer: {
        width: '100%',
        maxWidth: '360px',
        marginBottom: '20px',
        position: 'relative',
        userSelect: 'none',
    },
    dropdownHeader: {
        padding: '10px 14px',
        borderRadius: '8px',
        border: '1px solid #ddd',
        fontSize: '16px',
        backgroundColor: 'white',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        cursor: 'pointer',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    arrow: {
        marginLeft: '10px',
        fontSize: '12px',
        color: '#888',
    },
    dropdownList: {
        position: 'absolute',
        top: 'calc(100% + 4px)',
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
        maxHeight: '180px',
        overflowY: 'auto',
        zIndex: 10,
    },
    dropdownItem: {
        padding: '10px 14px',
        cursor: 'pointer',
        fontSize: '16px',
        color: '#333',
    },
    dropdownItemSelected: {
        padding: '10px 14px',
        cursor: 'pointer',
        fontSize: '16px',
        backgroundColor: 'black',
        color: 'white',
        fontWeight: 'bold',
    },

};

export default EventosPage;