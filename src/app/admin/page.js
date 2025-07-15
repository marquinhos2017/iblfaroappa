"use client"; // Adicione esta linha no topo do arquivo

import React, { useState, useEffect } from 'react';
import { collection, doc, setDoc, getDocs, orderBy, onSnapshot, query, where, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import '../../app/App.module.css';
import '../../app/admin/page.module.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useRouter } from 'next/navigation'; // ← certo para Next.js 13+
import { FiLogOut, FiTrash2, FiCalendar, FiChevronDown, FiUsers, FiMail, FiPlus, FiAirplay, FiX, FiPackage } from 'react-icons/fi';
import { IoMdCheckmarkCircleOutline } from 'react-icons/io';
import { MdEventAvailable } from 'react-icons/md';
import styles from '../../app/admin/page.module.css';


function App() {
    const [eventos, setEventos] = useState([]);
    const [availabilities, setAvailabilities] = useState([]);
    const [userName, setUserName] = useState('');
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [userAvailability, setUserAvailability] = useState({});
    const [showEventForm, setShowEventForm] = useState(false);
    const [disponibilidades, setDisponibilidades] = useState([]);
    const [loadingNames, setLoadingNames] = useState(false);


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



    async function handleEventSelect(event) {
        // Se já está selecionado, apenas fecha
        if (selectedEvent?.id === event.id) {
            setSelectedEvent(null);
            return;
        }

        setSelectedEvent(event);
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
            // Garante que musicoId é número
            musicoId: Number(doc.data().musicoId)
        }));

        setDisponibilidades(results);

        // Busca apenas os nomes que ainda não temos
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

            // Atualiza o estado de uma só vez
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
    const toggleEventForm = () => {
        setShowEventForm(!showEventForm);
    };
    const formattedDate = newEvent.date.toLocaleString('pt-BR', {
        dateStyle: 'full',
        timeStyle: 'short'
    });
    const deleteEvent = async (eventId) => {
        const confirmDelete = confirm('Tem certeza que deseja deletar este evento?');
        if (!confirmDelete) return;

        // Marca o evento como deletando para a animação
        setDeletingEvents(prev => new Set(prev).add(eventId));

        // Aguarda o tempo da animação (exemplo 300ms)
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
            await setDoc(doc(db, 'eventos', eventId), {}, { merge: false }); // Remove o doc
            await fetchEventos(); // Recarrega os eventos
            setSelectedEvent(null); // limpa a seleção atual
            alert('Evento deletado com sucesso!');
        } catch (error) {
            console.error('Erro ao deletar evento:', error);
            alert('Erro ao deletar evento.');
        } finally {
            // Remove o evento da lista de deletando
            setDeletingEvents(prev => {
                const copy = new Set(prev);
                copy.delete(eventId);
                return copy;
            });
        }
    };


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
            <header className={styles.header}>
                <h1 className={styles.title}>
                    <FiAirplay className={styles.titleIcon} />
                    Eventos IBL Faro
                </h1>

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

            {/* Novo Evento Form */}
            {showEventForm && (
                <div className={styles.modalBackdrop}>
                    <div className={styles.modalContent}>
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
                            <label>Data e Hora</label>
                            <DatePicker
                                selected={newEvent.date}
                                onChange={(date) =>
                                    setNewEvent((prev) => ({ ...prev, date }))
                                }
                                showTimeSelect
                                dateFormat="Pp"
                                timeFormat="HH:mm"
                                timeIntervals={15}
                                placeholderText="Selecione data/hora"
                                className={styles.datePicker}
                            />
                        </div>

                        <div className={styles.formButtons}>
                            <button
                                onClick={toggleEventForm}
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

                <div className={styles.eventList}>
                    {eventos.length === 0 && (
                        <p className={styles.emptyMessage}>Nenhum evento agendado</p>
                    )}

                    {eventos.map(event => {
                        const isSelected = selectedEvent?.id === event.id;
                        const eventDate = new Date(event.date?.seconds * 1000 || event.date);

                        return (
                            <div key={event.id} className={styles.eventWrapper}>
                                {/* Card clicável */}
                                <div
                                    key={event.id}
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
                                                {eventDate.toLocaleDateString('pt-BR', {
                                                    weekday: 'short',
                                                    day: '2-digit',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </p>
                                        </div>

                                        <FiChevronDown className={`${styles.arrowIcon} ${isSelected ? styles.rotated : ''}`} />
                                    </div>

                                    {/* Dropdown */}
                                    {isSelected && (
                                        <div className={styles.availabilityDropdown}>
                                            <div className={styles.availabilityHeader}>
                                                <FiUsers className={styles.availabilityIcon} />
                                                <span>Disponibilidades ({disponibilidades.length})</span>
                                            </div>

                                            {loadingNames ? (
                                                [...Array(Math.max(3, disponibilidades.length))].map((_, index) => (
                                                    <div key={`skeleton-${index}`} className={styles.skeletonItem}>
                                                        <div className={styles.skeletonIcon}></div>
                                                        <div className={styles.skeletonText}></div>
                                                    </div>
                                                ))
                                            ) : (
                                                disponibilidades.map(disp => {
                                                    const name = musicianNames[disp.musicoId];
                                                    return (
                                                        <div key={disp.id} className={styles.availabilityItem}>
                                                            <FiPackage
                                                                className={`${styles.statusIcon} ${disp.status === 'disponivel' ? styles.available : styles.unavailable}`}
                                                            />
                                                            <span className={styles.userEmail}>
                                                                {name || `ID: ${disp.musicoId}`}
                                                            </span>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Botão de deletar fora do card */}
                                <button
                                    onClick={async (e) => {
                                        e.stopPropagation();
                                        await deleteEvent(event.id);
                                    }}
                                    className={styles.deleteButtonOutside}
                                    title="Deletar evento"
                                >
                                    <FiTrash2 size={16} />
                                </button>
                            </div>

                        );
                    })}
                </div>
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