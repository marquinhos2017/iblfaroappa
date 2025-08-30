"use client"; // Adicione esta linha no topo do arquivo

import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, getDocs, orderBy, onSnapshot, query, where, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import '../../app/App.module.css';
import '../../app/admin/page.module.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useRouter } from 'next/navigation'; // ← certo para Next.js 13+
import { FiLogOut, FiChevronDown, FiTrash2, FiCalendar, FiChevronfDown, FiUsers, FiMail, FiPlus, FiAirplay, FiX, FiPackage, FiMusic } from 'react-icons/fi';
import { IoMdCheckmarkCircleOutline } from 'react-icons/io';
import { MdEventAvailable } from 'react-icons/md';
import styles from '../../app/admin/page.module.css';
import ModalDelete from '../components/modaldelete'; // ajuste conforme seu path





function App() {

    const [touchStartY, setTouchStartY] = useState(0);
    const [touchEndY, setTouchEndY] = useState(0);

    const [eventos, setEventos] = useState([]);
    const [availabilities, setAvailabilities] = useState([]);
    const [userName, setUserName] = useState('');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [userAvailability, setUserAvailability] = useState({});
    const [showEventForm, setShowEventForm] = useState(false);

    const [closingModal, setClosingModal] = useState(false);
    useEffect(() => {
        if (showEventForm) {
            // Salva a posição atual do scroll
            const scrollY = window.scrollY;

            // Bloqueia o scroll
            document.body.style.position = 'fixed';
            document.body.style.top = `-${scrollY}px`;
            document.body.style.width = '100%';

            return () => {
                // Restaura o scroll quando o modal fecha
                document.body.style.position = '';
                document.body.style.top = '';
                window.scrollTo(0, scrollY);
            };
        }
    }, [showEventForm]);


    const openEventForm = () => {
        setShowEventForm(true);
        setClosingModal(false);
    };

    const closeEventForm = () => {
        setClosingModal(true);
        setTimeout(() => {
            setShowEventForm(false);
            setClosingModal(false);
        }, 300); // Duração da animação
    };


    const [disponibilidades, setDisponibilidades] = useState([]);
    const [loadingNames, setLoadingNames] = useState(false);
    const [playlists, setPlaylists] = useState([]);

    const [modalOpen, setModalOpen] = useState(false);
    const [eventIdToDelete, setEventIdToDelete] = useState(null);

    const handleDeleteClick = (eventId, e) => {
        e.stopPropagation();
        setEventIdToDelete(eventId);
        setModalOpen(true);
    };

    const deleteEvent = async (eventId) => {
        setDeletingEvents(prev => new Set(prev).add(eventId));
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            await setDoc(doc(db, 'eventos', eventId), {}, { merge: false });
            await fetchEventos();
            setSelectedEvent(null);
            alert('Evento deletado com sucesso!');
        } catch (error) {
            console.error('Erro ao deletar evento:', error);
            alert('Erro ao deletar evento.');
        } finally {
            setDeletingEvents(prev => {
                const copy = new Set(prev);
                copy.delete(eventId);
                return copy;
            });
        }
    };

    const fetchPlaylists = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'playlista'));
            const data = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setPlaylists(data);

            // Buscar nomes dos músicos
            const userIds = [...new Set(data.map(item => item.user_id))]; // user_ids únicos
            const namesMap = {};

            await Promise.all(userIds.map(async (id) => {
                const name = await fetchMusicianNameByUserId(id);
                if (name) {
                    namesMap[id] = name;
                }
            }));

            setMusicianNamesById(namesMap);
        } catch (error) {
            console.error('Erro ao buscar playlists:', error);
        }
    };

    useEffect(() => {
        fetchEventos();
        fetchPlaylists(); // adiciona aqui
    }, []);

    const [musicianNames, setMusicianNames] = useState({}); // { musicoId: nome }
    const router = useRouter();
    const [newEvent, setNewEvent] = useState({


        name: '',
        date: new Date(), // Agora é um objeto Date

    });
    const [emails, setEmails] = useState([]);
    const [carregando, setCarregando] = useState(false);
    const [deletingEvents, setDeletingEvents] = React.useState(new Set());

    const listarEmails = async () => {
        setCarregando(true);
        try {
            const querySnapshot = await getDocs(collection(db, 'musicos'));
            const novosEmails = [];

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                if (data.email) {
                    novosEmails.push(data.email);
                }
            });

            setEmails(novosEmails); // atualiza o estado com os emails
        } catch (error) {
            console.error('Erro ao buscar emails:', error);
        }
        setCarregando(false);
    };
    useEffect(() => {
        if (showEventForm) {
            // Salva o overflow original
            const originalStyle = window.getComputedStyle(document.body).overflow;

            // Bloqueia o scroll
            document.body.style.overflow = 'hidden';

            // Ao desmontar ou mudar o estado, restaura
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [showEventForm]);

    const [disponibilidadesPorEvento, setDisponibilidadesPorEvento] = useState({});

    // Carrega eventos do Firestore

    const fetchEventos = async () => {
        const q = query(collection(db, 'eventos'), orderBy('date', 'asc'));
        const querySnapshot = await getDocs(q);
        const eventosData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
        setEventos(eventosData);
    };

    // Agora use dentro do useEffect:
    useEffect(() => {
        fetchEventos();
    }, []);

    // Observa mudanças nas disponibilidades
    // No seu useEffect que observa as disponibilidades

    const [allExpanded, setAllExpanded] = React.useState(false);

    useEffect(() => {
        if (allExpanded) {
            // Carrega disponibilidades para todos os eventos quando "Revelar tudo" é clicado
            eventos.forEach(event => {
                handleEventSelect(event);
            });
        }
    }, [allExpanded]);


    async function handleEventSelect(event) {
        // Se já está selecionado e NÃO estamos no modo "Revelar tudo", apenas fecha
        if (selectedEvent?.id === event.id && !allExpanded) {
            setSelectedEvent(null);
            return;
        }

        // Se estamos no modo "Revelar tudo", apenas carrega os dados sem mudar o selectedEvent
        if (!allExpanded) {
            setSelectedEvent(event);
        }

        setLoadingNames(true);

        const q = query(
            collection(db, "disponibilidades"),
            where("eventoId", "==", event.id),
            where("status", "==", "disponivel")
        );

        const querySnapshot = await getDocs(q);
        const results = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            musicoId: Number(doc.data().musicoId)
        }));

        // Armazena as disponibilidades por ID de evento
        setDisponibilidadesPorEvento(prev => ({
            ...prev,
            [event.id]: results
        }));

        // Busca nomes que ainda não temos
        const namesToFetch = results
            .filter(disp => !musicianNames[disp.musicoId])
            .map(disp => disp.musicoId);

        if (namesToFetch.length > 0) {
            const newNames = {};
            await Promise.all(
                namesToFetch.map(async (id) => {
                    const name = await fetchMusicianName(id);
                    if (name) {
                        newNames[id] = name;
                    }
                })
            );

            setMusicianNames(prev => ({ ...prev, ...newNames }));
        }

        setLoadingNames(false);
    }


    const handleTimeSlotToggle = (timeSlot) => {
        setUserAvailability(prev => ({
            ...prev,
            [timeSlot]: !prev[timeSlot]
        }));
    };
    const [musicianNamesById, setMusicianNamesById] = useState({});

    const fetchMusicianNameByUserId = async (userId) => {
        try {
            const userIdAsNumber = parseInt(userId); // ← conversão importante aqui

            const q = query(
                collection(db, 'musicos'),
                where('user_id', '==', userIdAsNumber)
            );

            const snapshot = await getDocs(q);

            if (!snapshot.empty) {
                return snapshot.docs[0].data().name;
            }
        } catch (error) {
            console.error(`Erro ao buscar músico com user_id ${userId}:`, error);
        }
        return null;
    };

    const submitAvailability = async () => {
        if (!userName || !selectedEvent) return;

        const userDoc = doc(db, 'eventos', selectedEvent.id, 'availabilities', userName);

        try {
            await setDoc(userDoc, {
                name: userName,
                availability: userAvailability,
                timestamp: new Date()
            });
            alert('Disponibilidade salva com sucesso!');
        } catch (error) {
            console.error('Erro ao salvar disponibilidade:', error);
            alert('Erro ao salvar disponibilidade');
        }
    };

    const calculateAvailabilitySummary = () => {
        const summary = {};

        selectedEvent?.timeSlots?.forEach(slot => {
            summary[slot] = availabilities.filter(avail => avail.availability[slot]).length;
        });

        return summary;
    };
    const fetchMusicianName = async (musicoId) => {
        console.log(`Buscando nome para ID: ${musicoId}`);

        try {
            const q = query(
                collection(db, 'musicos'),
                where('user_id', '==', musicoId) // Já convertemos para número antes
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const data = querySnapshot.docs[0].data();
                console.log('Músico encontrado:', data.name);
                return data.name;
            }

            console.warn('Nenhum músico encontrado para ID:', musicoId);
            return null;
        } catch (error) {
            console.error('Erro ao buscar músico:', error);
            return null;
        }
    };
    const [expandedArtists, setExpandedArtists] = useState({});

    const toggleArtist = (artist) => {
        setExpandedArtists(prev => ({
            ...prev,
            [artist]: !prev[artist]
        }));
    };

    const toggleEventForm = () => {
        setShowEventForm(!showEventForm);
    };
    const formattedDate = newEvent.date
        ? newEvent.date.toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
        : '';


    const createSeptemberEvents = async () => {
        const year = 2025;
        const month = 8; // Setembro (0 = janeiro, então setembro = 8)

        let eventsToAdd = [];

        // Pega todos os dias de setembro
        const daysInSeptember = new Date(year, month + 1, 0).getDate();

        for (let day = 1; day <= daysInSeptember; day++) {
            const currentDate = new Date(year, month, day);

            const weekday = currentDate.getDay(); // 0 = domingo, 3 = quarta

            if (weekday === 3) {
                // Quarta-feira -> Culto Fé às 20:00
                const date = new Date(year, month, day, 20, 0, 0);
                eventsToAdd.push({
                    name: "Culto Fé",
                    date
                });
            }

            if (weekday === 0) {
                // Domingo -> Culto de Celebração (10:00 e 19:30)
                const morning = new Date(year, month, day, 10, 0, 0);
                const night = new Date(year, month, day, 19, 30, 0);

                eventsToAdd.push({ name: "Culto de Celebração", date: morning });
                eventsToAdd.push({ name: "Culto de Celebração", date: night });
            }
        }

        try {
            const batchEvents = [];

            for (let ev of eventsToAdd) {
                const formattedDate = ev.date.toLocaleString("pt-BR", {
                    dateStyle: "full",
                    timeStyle: "short"
                });

                const docRef = await addDoc(collection(db, "eventos"), {
                    name: ev.name,
                    date: ev.date,
                    dateFormatted: formattedDate,
                    createdAt: new Date()
                });

                batchEvents.push({
                    id: docRef.id,
                    name: ev.name,
                    date: ev.date,
                    dateFormatted: formattedDate
                });
            }

            setEventos(prev => [...prev, ...batchEvents]);
            alert("Eventos de setembro criados com sucesso!");
        } catch (error) {
            console.error("Erro ao criar eventos de setembro:", error);
            alert(`Erro: ${error.message}`);
        }
    };
    const generateSeptemberEvents = () => {
        const year = 2025;
        const month = 8; // setembro (0-based)
        const daysInSeptember = new Date(year, month + 1, 0).getDate();

        let events = [];

        for (let day = 1; day <= daysInSeptember; day++) {
            const currentDate = new Date(year, month, day);
            const weekday = currentDate.getDay(); // 0=domingo, 3=quarta

            if (weekday === 3) {
                // Quarta-feira
                const date = new Date(year, month, day, 20, 0, 0);
                events.push({
                    name: "Culto Fé",
                    date,
                    dateFormatted: date.toLocaleString("pt-BR", {
                        dateStyle: "full",
                        timeStyle: "short"
                    })
                });
            }

            if (weekday === 0) {
                // Domingo -> manhã e noite
                const morning = new Date(year, month, day, 10, 0, 0);
                const night = new Date(year, month, day, 19, 30, 0);

                events.push({
                    name: "Culto de Celebração",
                    date: morning,
                    dateFormatted: morning.toLocaleString("pt-BR", {
                        dateStyle: "full",
                        timeStyle: "short"
                    })
                });

                events.push({
                    name: "Culto de Celebração",
                    date: night,
                    dateFormatted: night.toLocaleString("pt-BR", {
                        dateStyle: "full",
                        timeStyle: "short"
                    })
                });
            }
        }

        setSeptemberEvents(events);
        setShowPreview(true);
    };
    const [septemberEvents, setSeptemberEvents] = useState([]);
    const [showPreview, setShowPreview] = useState(false);

    const handleNewEventChange = (e) => {
        const { name, value } = e.target;
        setNewEvent(prev => ({
            ...prev,
            [name]: value
        }));
    };


    const createEvent = async () => {
        if (!newEvent.name || !newEvent.date) {
            alert('Preencha todos os campos');
            return;
        }

        const formattedDate = newEvent.date.toLocaleString('pt-BR', {
            dateStyle: 'full',
            timeStyle: 'short'
        });

        try {
            const docRef = await addDoc(collection(db, 'eventos'), {
                name: newEvent.name,
                date: newEvent.date, // <-- salva como Date mesmo
                dateFormatted: formattedDate, // <-- para exibição
                createdAt: new Date()
            });

            setEventos(prev => [...prev, {
                id: docRef.id,
                name: newEvent.name,
                date: newEvent.date,
                dateFormatted: formattedDate
            }]);

            setNewEvent({ name: '', date: new Date() });
            setShowEventForm(false);
            alert('Evento criado com sucesso! ID: ' + docRef.id);
        } catch (error) {
            console.error('Erro detalhado:', error);
            alert(`Erro ao criar evento: ${error.message}`);
        }
    };



    return (

        <div className={styles.container}>
            {/* Header */}
            <button
                onClick={generateSeptemberEvents}
                className={styles.primaryButton}
            >
                Gerar Eventos de Setembro
            </button>
            {showPreview && (
                <div className={styles.previewBox}>
                    <h3>Eventos que serão criados:</h3>
                    <ul>
                        {septemberEvents.map((ev, idx) => (
                            <li key={idx}>
                                <strong>{ev.name}</strong> – {ev.dateFormatted}
                            </li>
                        ))}
                    </ul>

                    <div className={styles.formButtons}>
                        <button
                            onClick={() => setShowPreview(false)}
                            className={styles.secondaryButton}
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={async () => {
                                try {
                                    const batchEvents = [];
                                    for (let ev of septemberEvents) {
                                        const docRef = await addDoc(collection(db, "eventos"), {
                                            ...ev,
                                            createdAt: new Date()
                                        });
                                        batchEvents.push({ id: docRef.id, ...ev });
                                    }
                                    setEventos(prev => [...prev, ...batchEvents]);
                                    setShowPreview(false);
                                    alert("Eventos de setembro criados com sucesso!");
                                } catch (error) {
                                    console.error("Erro:", error);
                                    alert("Erro ao criar eventos");
                                }
                            }}
                            className={styles.primaryButton}
                        >
                            Confirmar Criação
                        </button>
                    </div>
                </div>
            )}


            <header className={styles.header}>
                <img src="/assets/L.png" alt="Lagoinha Faro Music Logo" className={styles.logo} />
                <div className={styles.headerActions}>
                    <button
                        onClick={toggleEventForm}
                        className={`${styles.iconButton} ${showEventForm ? styles.cancelButton : ''}`}
                    >
                        {showEventForm ? <FiX size={20} /> : <FiPlus size={20} />}
                    </button>

                    <button
                        onClick={() => router.push('/login')}
                        className={styles.iconButton}
                        title="Sair"
                    >
                        <FiLogOut size={20} />
                    </button>
                </div>
            </header>

            {showEventForm && (
                <div
                    className={styles.modalBackdrop}
                    onClick={closeEventForm}
                >
                    <div
                        className={`${styles.modalContent} ${closingModal ? styles.slideDown : styles.slideUp}`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className={styles.gestureHandle}></div>

                        <h2 className={styles.formTitle}>
                            <FiPlus className={styles.formIcon} />
                            Novo Evento
                        </h2>

                        <div className={styles.formGroup}>
                            <label>Nome do Evento</label>
                            <input
                                type="text"
                                name="name"
                                value={newEvent.name}
                                onChange={handleNewEventChange}
                                placeholder="Ex: Ensaio de Páscoa"
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label>Data</label>
                            <div className={styles.datepickerWrapper}>
                                <DatePicker
                                    selected={newEvent.date}
                                    onChange={(date) => setNewEvent(prev => ({ ...prev, date }))}
                                    dateFormat="dd/MM/yyyy"
                                    placeholderText="Selecione a data"
                                    className={styles.input}
                                    inline={false} // pra aparecer como input, não inline
                                /></div>
                        </div>

                        <div className={styles.formGroup} style={{ marginTop: '12px' }}>
                            <label>Hora</label>
                            <div className="container-datepicker">
                                <DatePicker
                                    selected={newEvent.time}
                                    onChange={(time) => setNewEvent(prev => ({ ...prev, time }))}
                                    showTimeSelect
                                    showTimeSelectOnly
                                    timeIntervals={15}
                                    timeCaption="Hora"
                                    dateFormat="HH:mm"
                                    placeholderText="Selecione a hora"
                                    className={styles.input}
                                    inline={false}
                                />
                            </div>

                        </div>



                        <div className={styles.formButtons}>
                            <button
                                onClick={closeEventForm}
                                className={styles.secondaryButton}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={createEvent}
                                className={styles.primaryButton}
                                disabled={!newEvent.name || !newEvent.date}
                            >
                                Criar Evento
                            </button>
                        </div>
                    </div>
                </div>
            )}



            {/* Lista de Eventos */}
            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <FiCalendar className={styles.sectionIcon} />
                    Próximos Eventos
                </h2>

                {/* Botão Revelar/Ocultar tudo */}
                {eventos.length > 0 && (
                    <button
                        onClick={() => setAllExpanded(prev => !prev)}
                        className={styles.showAllButton}
                    >
                        {allExpanded ? 'Ocultar tudo' : 'Revelar tudo'}
                    </button>
                )}

                <div className={styles.eventList}>
                    {eventos.length === 0 && (
                        <p className={styles.emptyMessage}>Nenhum evento agendado</p>
                    )}

                    {Object.entries(
                        eventos.reduce((acc, event) => {
                            const eventDate = new Date(event.date?.seconds * 1000 || event.date);
                            const mesAno = eventDate.toLocaleDateString("pt-BR", {
                                month: "long",
                                year: "numeric"
                            });

                            if (!acc[mesAno]) acc[mesAno] = [];
                            acc[mesAno].push({ ...event, eventDate });
                            return acc;
                        }, {})
                    ).map(([mesAno, eventosDoMes]) => (
                        <div key={mesAno} className={styles.monthGroup}>
                            <h3 className={styles.monthTitle}>{mesAno}</h3>

                            {eventosDoMes
                                .sort((a, b) => a.eventDate - b.eventDate) // garante ordem cronológica
                                .map(event => {
                                    const isSelected =
                                        allExpanded || (selectedEvent?.id === event.id);

                                    return (
                                        <div key={event.id} className={styles.eventWrapper}>
                                            <div
                                                className={`
                                        ${styles.eventCard} 
                                        ${isSelected ? styles.selectedEvent : ''} 
                                        ${deletingEvents.has(event.id) ? styles.fadeOut : ''}
                                    `}
                                                onClick={() => handleEventSelect(event)}
                                            >
                                                <div className={styles.eventTopRow}>
                                                    <div className={styles.eventInfo}>
                                                        <h3 className={styles.eventName}>{event.name}</h3>
                                                        <p className={styles.eventDate}>
                                                            {event.eventDate.toLocaleDateString('pt-BR', {
                                                                weekday: 'short',
                                                                day: '2-digit',
                                                                month: 'short',
                                                                hour: '2-digit',
                                                                minute: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>

                                                    <FiChevronDown
                                                        className={`${styles.arrowIcon} ${isSelected ? styles.rotated : ''
                                                            }`}
                                                    />
                                                </div>

                                                {/* Botão de deletar */}
                                                <div className={styles.cardActions}>
                                                    <button
                                                        onClick={(e) =>
                                                            handleDeleteClick(event.id, e)
                                                        }
                                                        className={styles.deleteButtonInside}
                                                    >
                                                        <FiTrash2 size={16} />
                                                        <span>Deletar</span>
                                                    </button>
                                                </div>

                                                <ModalDelete
                                                    isOpen={modalOpen}
                                                    onClose={() => setModalOpen(false)}
                                                    onConfirm={() => {
                                                        deleteEvent(eventIdToDelete);
                                                        setModalOpen(false);
                                                    }}
                                                    message="Tem certeza que deseja deletar este evento?"
                                                />

                                                {/* Dropdown apenas se selecionado */}
                                                {isSelected && (
                                                    <div
                                                        className={styles.availabilityDropdown}
                                                    >
                                                        <div
                                                            className={styles.availabilityHeader}
                                                        >
                                                            <FiUsers
                                                                className={styles.availabilityIcon}
                                                            />
                                                            <span>
                                                                Disponibilidades (
                                                                {(
                                                                    disponibilidadesPorEvento[
                                                                    event.id
                                                                    ] || []
                                                                ).length}
                                                                )
                                                            </span>
                                                        </div>

                                                        {loadingNames ? (
                                                            [...Array(
                                                                Math.max(
                                                                    3,
                                                                    (
                                                                        disponibilidadesPorEvento[
                                                                        event.id
                                                                        ] || []
                                                                    ).length
                                                                )
                                                            )].map((_, index) => (
                                                                <div
                                                                    key={`skeleton-${index}`}
                                                                    className={
                                                                        styles.skeletonItem
                                                                    }
                                                                >
                                                                    <div
                                                                        className={
                                                                            styles.skeletonIcon
                                                                        }
                                                                    ></div>
                                                                    <div
                                                                        className={
                                                                            styles.skeletonText
                                                                        }
                                                                    ></div>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            (
                                                                disponibilidadesPorEvento[
                                                                event.id
                                                                ] || []
                                                            ).map((disp) => {
                                                                const name =
                                                                    musicianNames[
                                                                    disp.musicoId
                                                                    ];
                                                                return (
                                                                    <div
                                                                        key={disp.id}
                                                                        className={
                                                                            styles.availabilityItem
                                                                        }
                                                                    >
                                                                        <FiPackage
                                                                            className={`${styles.statusIcon} ${disp.status ===
                                                                                'disponivel'
                                                                                ? styles.available
                                                                                : styles.unavailable
                                                                                }`}
                                                                        />
                                                                        <span
                                                                            className={
                                                                                styles.userEmail
                                                                            }
                                                                        >
                                                                            {name ||
                                                                                `ID: ${disp.musicoId}`}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                        </div>
                    ))}
                </div>
            </section>


            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <FiMusic className={styles.sectionIcon} />
                    Artistas da Playlist
                </h2>

                {Object.entries(
                    playlists.reduce((acc, item) => {
                        const artist = item.artist || 'Desconhecido';
                        if (!acc[artist]) acc[artist] = [];
                        acc[artist].push(item);
                        return acc;
                    }, {})
                ).map(([artist, items]) => (
                    <div key={artist} className={styles.artistSection}>
                        <button
                            className={styles.artistToggle}
                            onClick={() => toggleArtist(artist)}
                        >
                            {expandedArtists[artist] ? '▼' : '▶'} {artist} ({items.length})
                        </button>

                        {expandedArtists[artist] && (
                            <div className={styles.playlistGrid}>
                                {items.map(item => (
                                    <div key={item.id} className={styles.cardWrapper}>
                                        <div className={styles.playlistCard}>
                                            <img src={item.cover} alt="cover" className={styles.playlistCover} />
                                            <h3 style={{ fontSize: '16px' }}>{item.title}</h3>
                                            <p><strong>Escolhido por:</strong> {musicianNamesById[item.user_id] || 'Desconhecido'}</p>
                                            <div className={styles.links}>
                                                <a href={item.deezer_link} target="_blank" rel="noopener noreferrer">Deezer</a>
                                                {item.youtube_link && item.youtube_link !== "" && (
                                                    <a href={item.youtube_link} target="_blank" rel="noopener noreferrer">YouTube</a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </section>


            <section className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <FiPackage className={styles.sectionIcon} />
                    Sugestões Repertório 2025.2
                </h2>

                {Object.entries(
                    playlists.reduce((acc, item) => {
                        const musicianName = musicianNamesById[item.user_id] || 'Desconhecido';
                        if (!acc[musicianName]) acc[musicianName] = [];
                        acc[musicianName].push(item);
                        return acc;
                    }, {})
                ).map(([musicianName, items]) => (
                    <div key={musicianName} className={styles.musicianSection}>
                        <h2>
                            {musicianName} ({items.length})
                        </h2>
                        <div className={styles.playlistGrid}>
                            {items.map((item) => (
                                <div key={item.id} className={styles.cardWrapper}>
                                    <div className={styles.playlistCard}>
                                        <img src={item.cover} alt="cover" className={styles.playlistCover} />
                                        <h3 style={{ fontSize: '16px' }}>{item.title}</h3>
                                        <p><strong>Artista:</strong> {item.artist}</p>
                                        <div className={styles.links}>
                                            <a href={item.deezer_link} target="_blank" rel="noopener noreferrer">Deezer</a>
                                            {item.youtube_link && item.youtube_link !== "" && (
                                                <a href={item.youtube_link} target="_blank" rel="noopener noreferrer">YouTube</a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                ))}
            </section>





            {/* Lista de Emails */}
            <section className={styles.section}>
                <div className={styles.sectionHeader}>
                    <h2 className={styles.sectionTitle}>
                        <FiMail className={styles.sectionIcon} />
                        Músicos Cadastrados
                    </h2>

                    <button
                        onClick={listarEmails}
                        className={styles.smallButton}
                        disabled={carregando}
                    >
                        {carregando ? 'Carregando...' : 'Atualizar'}
                    </button>
                </div>

                {emails.length > 0 ? (
                    <ul className={styles.emailList}>
                        {emails.map((email, index) => (
                            <li key={index} className={styles.emailItem}>
                                <a href={`mailto:${email}`} className={styles.emailLink}>
                                    {email}
                                </a>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className={styles.emptyMessage}>
                        {carregando ? 'Buscando emails...' : 'Nenhum email encontrado'}
                    </p>
                )}
            </section>
        </div>
    );

}

export default App;