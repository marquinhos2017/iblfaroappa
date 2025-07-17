"use client";

import { useState, useEffect, useRef } from "react";
import { FaTrash, FaMusic } from "react-icons/fa";
import { useRouter } from "next/navigation"; import Loading from "@/components/loading";
import { FaUser, FaLock, FaSave, FaTimes } from 'react-icons/fa'; // ícones do react-icons

import { db } from "@/firebase/firebase"; // Ajuste o caminho conforme sua estrutura
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, updateDoc, getDoc } from "firebase/firestore";
import Badge from "./Badge";
import { FiLogOut, FiTrash2, FiCalendar, FiChevronDown, FiUsers, FiMail, FiPlus, FiAirplay, FiX, FiPackage } from 'react-icons/fi';

export default function DeezerSearchPage() {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [showBadge, setShowBadge] = useState(false);
  const [loadingSavedSongs, setLoadingSavedSongs] = useState(true);
  const router = useRouter();
  const audioRef = useRef(null); // Initialize as null
  const [user, setUser] = useState(() => {
    // Only access localStorage when window is available
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser) : null;
    }
    return null;
  });
  const [newPassword, setNewPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savedSongs, setSavedSongs] = useState([]);
  const [showSavedSongs, setShowSavedSongs] = useState(false);
  const [editSong, setEditSong] = useState({
    title: '',
    artist: '',
    album: '',
    preview: '',
    cover: '',
    deezer_link: '',
    youtube_link: '',
  });
  const openModala = () => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    setNewName(storedUser?.name || '');
    setNewPassword(storedUser?.password || '');
    setModalOpen(true);
  };


  // Estado para controlar o Botto
  const deleteSongFromDatabase = async (songId) => {
    try {
      if (window.confirm(`Tem certeza que deseja deletar esta música?`)) {
        await deleteDoc(doc(db, 'playlista', songId));

        // Atualiza o estado local removendo a música deletada
        setSavedSongs(prevSongs => prevSongs.filter(song => song.id !== songId));

        console.log(`Música com ID ${songId} deletada com sucesso.`);
      }
    } catch (error) {
      console.error('Erro ao deletar música:', error);
      alert('Erro ao deletar música');
    }
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');

  const handleSave = async () => {
    if (!newName.trim()) return alert("Nome não pode ficar vazio");
    if (!newPassword.trim()) return alert("Senha não pode ficar vazia");

    try {
      const musicosRef = collection(db, "musicos");
      const q = query(musicosRef, where("user_id", "==", user.user_id));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("Usuário não encontrado!");
        return;
      }

      for (const docSnapshot of querySnapshot.docs) {
        await updateDoc(docSnapshot.ref, {
          name: newName.trim(),
          password: newPassword.trim(),
        });

        // Atualiza localStorage com dados novos
        const userSnap = await getDoc(docSnapshot.ref);
        if (userSnap.exists()) {
          const usuarioAtualizado = userSnap.data();

          if (typeof window !== 'undefined') {
            const userStorage = JSON.parse(localStorage.getItem('user')) || {};
            const novoUserStorage = {
              ...userStorage,
              name: usuarioAtualizado.name,
              password: usuarioAtualizado.password,
            };
            localStorage.setItem('user', JSON.stringify(novoUserStorage));
          }
        }
      }

      //alert("Nome e senha atualizados com sucesso!");
      //    setModalOpen(false);
    } catch (error) {
      console.error("Erro ao atualizar nome e senha:", error);
      alert("Erro ao atualizar nome e senha");
    }
  };




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
    container: {
      padding: '16px',
      paddingBottom: '100px',
      maxWidth: '600px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif',
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
    leftSection: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    backButton: {
      background: 'none',
      color: 'white',
      border: 'none',
      fontSize: '20px',
      cursor: 'pointer',
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
      gap: '12px',
    },
    iconButton: {
      backgroundColor: 'transparent',
      border: '1.5px solid white',
      borderRadius: '8px',
      color: 'white',
      padding: '6px 10px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '18px',
    },
    userBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
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

    avatar: {
      width: 48,
      height: 48,
      borderRadius: '50%',
      backgroundColor: '#000',
      color: '#fff',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: 24,
      cursor: 'pointer',
      userSelect: 'none',
    },

    avatar: {
      width: '40px',
      height: '40px',
      borderRadius: '50%',
      backgroundColor: '#333',
      color: '#fff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      border: '2px solid white',  // <-- aqui adiciona a borda branca
      userSelect: 'none',
    },
    modalBackdrop: {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 999,
    },
    modal: {
      backgroundColor: '#fff',
      padding: 20,
      borderRadius: 8,
      width: 320,
      boxSizing: 'border-box',
    },
    modalBackdrop: {
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    },
    modal: {
      background: '#fff',
      borderRadius: 10,
      padding: 20,
      width: '90%',
      maxWidth: 400,
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
    },

    inputGroup: {
      display: 'flex',
      alignItems: 'center',
      marginBottom: 15,
      border: '1px solid #ccc',
      borderRadius: 8,
      padding: '8px 12px',
      backgroundColor: '#f9f9f9',
    },
    icon: {
      marginRight: 10,
      color: '#666',
    },
    input: {
      border: 'none',
      outline: 'none',
      flex: 1,
      fontSize: 16,
      backgroundColor: 'transparent',
    },
    buttonsRow: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: 10,
    },
    saveButton: {
      backgroundColor: 'black',
      color: '#fff',
      border: 'none',
      padding: '10px 18px',
      borderRadius: 8,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      fontWeight: 'bold',
      fontSize: 16,
    },
    cancelButton: {
      backgroundColor: '#ddd',
      border: 'none',
      padding: '10px 18px',
      borderRadius: 8,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      fontWeight: 'bold',
      fontSize: 16,
      color: '#333',
    },
    buttonIcon: {
      marginRight: 8,
    },


  };

  useEffect(() => {
    audioRef.current = typeof Audio !== 'undefined' ? new Audio() : null;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);
  const onSaveClick = async () => {
    setIsSaving(true);
    try {
      await handleSave();
      setShowBadge(true);
      setTimeout(() => {
        setShowBadge(false);
        setModalOpen(false);
      }, 2000);
    } catch (err) {
      alert("Erro ao salvar");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (user?.user_id) {
      loadSavedSongs();
    }
  }, [user?.user_id]);
  // Verificar autenticação ao carregar a página 
  useEffect(() => {
    const checkAuth = () => {
      // Only run on client side
      if (typeof window === 'undefined') return null;

      const userData = JSON.parse(localStorage.getItem('user'));
      const token = localStorage.getItem('authToken');

      if (!userData || !token) {
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        router.replace('/login');
        return null;
      }
      return userData;
    };

    const userData = checkAuth();
    if (userData) {
      setUser(userData);
      setAuthenticated(true);
      setLoadingAuth(false);
      loadSavedSongs();

      // Move DOM access to client-side only
      if (typeof document !== 'undefined') {
        const avatar = document.querySelector('[data-avatar]');
        if (avatar && userData.name) {
          avatar.textContent = userData.name.charAt(0).toUpperCase();
        }
      }
    }
  }, [router]);
  const loadSavedSongs = async () => {
    try {
      // Verifica se o usuário está autenticado e tem um ID
      if (!user?.user_id) {
        console.error("Usuário não autenticado ou ID inválido");
        return;
      }

      setLoadingSavedSongs(true);

      const q = query(
        collection(db, 'playlista'),
        where('user_id', '==', user.user_id)
      );

      const querySnapshot = await getDocs(q);
      const songs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setSavedSongs(songs);
    } catch (error) {
      console.error("Erro detalhado ao carregar músicas:", error);

      // Mostra mensagem mais específica
      let errorMessage = "Erro ao carregar músicas salvas";
      if (error.code === 'permission-denied') {
        errorMessage = "Você não tem permissão para acessar estas músicas";
      } else if (error.code === 'unavailable') {
        errorMessage = "Serviço indisponível. Tente novamente mais tarde";
      }

      alert(errorMessage);
    } finally {
      setLoadingSavedSongs(false);
    }
  };

  const bottomSheetStyles = {
    container: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'white',
      borderTopLeftRadius: '16px',
      borderTopRightRadius: '16px',
      padding: '16px',
      boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.15)',
      zIndex: 1001,
      maxHeight: '70vh',
      overflowY: 'auto',
      transition: 'transform 0.3s ease-out',
      transform: showSavedSongs ? 'translateY(0)' : 'translateY(100%)',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '16px',
      paddingBottom: '8px',
      borderBottom: '1px solid #eee',
    },
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      zIndex: 1000,
      display: showSavedSongs ? 'block' : 'none',
    },
  };

  const togglePlay = (song) => {
    if (!audioRef.current) return;

    if (playingId === song.id) {
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      audioRef.current.src = song.preview;
      audioRef.current.play()
        .then(() => setPlayingId(song.id))
        .catch(error => console.error("Error playing audio:", error));

      audioRef.current.onended = () => setPlayingId(null);
    }
  };
  useEffect(() => {
    return () => {
      // Limpeza do áudio
      audioRef.current.pause();
    };
  }, []);

  if (loadingAuth) {
    return <Loading />;
  }

  if (!authenticated) {
    return null;
  } async function handleSearch(e) {
    e.preventDefault();
    if (!search) return;
    setLoading(true);

    try {
      const res = await fetch(`/api/deezer/search?q=${encodeURIComponent(search)}`);

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(`${res.status} - ${errorData.error || 'Erro na busca'}`);
      }

      const data = await res.json();
      setResults(data.data || []);
    } catch (error) {
      alert("Erro ao buscar: " + error.message);
    } finally {
      setLoading(false);
    }
  }
  // Componente do BottomSheet
  const savedSongsBottomSheet = (
    <>
      <div
        style={bottomSheetStyles.overlay}
        onClick={() => setShowSavedSongs(false)}
      />

      <div style={bottomSheetStyles.container}>
        <div style={bottomSheetStyles.header}>
          <h3 style={{ margin: 0 }}>Músicas Salvas ({savedSongs.length})</h3>
          <button
            onClick={() => setShowSavedSongs(false)}
            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        {savedSongs.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666' }}>Nenhuma música salva ainda</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {savedSongs.map((song) => {
              let holdTimeout;

              const handleDelete = () => {
                if (window.confirm(`Deseja deletar "${song.title}"?`)) {
                  deleteSongFromDatabase(song.id); // substitua com sua função de deletar
                }
              };

              return (
                <li
                  key={song.id}
                  style={{
                    padding: '12px',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f5f5f5';
                    e.currentTarget.style.transform = 'translateX(5px)';
                    e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '';
                    e.currentTarget.style.transform = '';
                    e.currentTarget.style.boxShadow = '';
                    clearTimeout(holdTimeout);
                  }}
                  onMouseDown={() => {
                    holdTimeout = setTimeout(() => {
                      handleDelete();
                    }, 1000); // segurar por 1 segundo
                  }}
                  onMouseUp={() => clearTimeout(holdTimeout)}
                  onTouchStart={() => {
                    holdTimeout = setTimeout(() => {
                      handleDelete();
                    }, 1000); // também funciona no mobile
                  }}
                  onTouchEnd={() => clearTimeout(holdTimeout)}
                >
                  {song.cover && (
                    <img
                      src={song.cover}
                      alt="Capa do álbum"
                      style={{
                        width: '50px',
                        height: '50px',
                        borderRadius: '4px',
                        marginRight: '12px',
                        objectFit: 'cover'
                      }}
                    />
                  )}

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>{song.title}</div>
                    <div style={{ fontSize: '14px', color: '#666' }}>{song.artist}</div>
                  </div>

                  <button
                    onClick={() => {
                      if (song.preview) {
                        togglePlay({
                          id: song.id,
                          preview: song.preview
                        });
                      }
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0B3D91',
                      fontSize: '20px',
                      cursor: 'pointer',
                      marginLeft: '12px',
                      transition: 'transform 0.2s ease'
                    }}
                  >
                    {playingId === song.id ? '❚❚' : '▶'}
                  </button>
                </li>
              );
            })}
          </ul>

        )}
      </div>
    </>
  );

  const appBar = (
    <header style={styles.appBar}>
      {/* Voltar e Título */}
      <div style={styles.leftSection}>
        <button
          onClick={() => router.back()}
          style={styles.backButton}
          title="Voltar"
        >
          ←
        </button>

      </div>

      {/* Usuário + Ações */}
      <div style={styles.headerActions}>
        <div style={styles.userBadge}>
          <div
            style={styles.avatar}
            onClick={openModala}  // chama openModal que seta os estados e abre modal
            title="Clique para editar nome e senha"
          >
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>

          {modalOpen && (
            <div
              style={styles.modalBackdrop}
              onClick={() => {
                if (!isSaving && !showBadge) {
                  setModalOpen(false);
                }
              }}
            >
              <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h3 style={styles.title}>Editar nome e senha</h3>

                <div style={styles.inputGroup}>
                  <FaUser style={styles.icon} />
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Novo nome"
                    style={styles.input}
                    disabled={isSaving}
                  />
                </div>

                <div style={styles.inputGroup}>
                  <FaLock style={styles.icon} />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nova senha"
                    style={styles.input}
                    disabled={isSaving}
                  />
                </div>

                <div style={styles.buttonsRow}>
                  <button
                    style={styles.cancelButton}
                    onClick={() => {
                      if (!isSaving && !showBadge) {
                        setModalOpen(false);
                      }
                    }}
                    disabled={isSaving || showBadge}
                  >
                    <FaTimes style={styles.buttonIcon} />
                    Cancelar
                  </button>

                  <div style={{ position: "relative", display: "inline-block" }}>
                    <button
                      style={styles.saveButton}
                      onClick={onSaveClick}
                      disabled={isSaving}
                    >
                      <FaSave style={styles.buttonIcon} />
                      {isSaving ? "Salvando..." : "Salvar"}
                    </button>

                    {showBadge && (
                      <div
                        style={{
                          position: "absolute",
                          top: "-40px",
                          right: 0,
                          backgroundColor: "#4caf50",
                          color: "white",
                          padding: "8px 15px",
                          borderRadius: 8,
                          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
                          fontWeight: "bold",
                          whiteSpace: "nowrap",
                          zIndex: 9999,
                          animation: "fadeInDrop 0.3s ease",
                        }}
                      >
                        Salvo com sucesso!
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <style>{`
              @keyframes fadeInDrop {
                0% {
                  opacity: 0;
                  transform: translateY(-10px);
                }
                100% {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
            </div>
          )}

          <div>{user?.name || 'Usuário'}</div>
        </div>

        {/* Músicas Salvas */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowSavedSongs(true)}
            style={styles.iconButton}
            title="Músicas salvas"
          >
            <FaMusic />
          </button>
          {!loadingSavedSongs && savedSongs.length > 0 && (
            <Badge count={savedSongs.length} />
          )}
        </div>

        {/* Logout */}
        <button
          onClick={() => {
            localStorage.removeItem('authToken');
            router.push('/login');
          }}
          style={styles.iconButton}
          title="Logout"
        >
          <FiLogOut size={20} />
        </button>
      </div>
    </header>
  );

  const saveToFirestore = async () => {
    if (!editSong.title?.trim() || !editSong.artist?.trim()) {
      alert('Por favor, preencha pelo menos o título e artista.');
      return;
    }

    setSavingId(editSong.title);
    try {
      const docRef = await addDoc(collection(db, 'playlista'), {
        title: editSong.title,
        artist: editSong.artist,
        album: editSong.album,
        preview: editSong.preview,
        cover: editSong.cover,
        deezer_link: editSong.deezer_link,
        youtube_link: editSong.youtube_link,
        user_id: user.user_id,
        createdAt: new Date()
      });

      alert('Música salva com sucesso!');
      setIsModalOpen(false);

      // Atualiza a lista local de músicas salvas
      setSavedSongs(prev => [...prev, { id: docRef.id, ...editSong }]);
    } catch (err) {
      console.error('Erro ao salvar música:', err);
      alert('Erro ao salvar música: ' + err.message);
    } finally {
      setSavingId(null);
    }
  };

  const openModal = (song) => {
    setEditSong({
      title: song.title,
      artist: song.artist.name,
      album: song.album.title,
      preview: song.preview,
      cover: song.album.cover_medium,
      deezer_link: song.link,
      youtube_link: '',
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditSong((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <>
      {appBar}
      <div style={{ padding: 20, fontFamily: 'Arial, sans-serif', backgroundColor: '#fff', color: '#000' }}>


        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: 10,
                  width: '100%',
                  border: '1px solid #ccc',
                  borderRight: 'none',
                  borderRadius: '4px 0 0 4px',
                  outline: 'none',
                  fontSize: 16,
                  backgroundColor: 'transparent',
                  color: '#000',
                }}
              />

              {/* Placeholder animado personalizado */}
              {!search && (
                <div
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    width: 'calc(100% - 24px)',
                    pointerEvents: 'none',
                  }}
                >
                  <div
                    style={{
                      display: 'inline-block',
                      animation: 'scrollText 8s linear infinite',
                    }}
                  >
                    Digite o nome da música ou artista
                  </div>
                </div>
              )}

              {/* Keyframes dentro de um style tag */}
              <style>
                {`
      @keyframes scrollText {
        0% {
          transform: translateX(100%);
        }
        100% {
          transform: translateX(-100%);
        }
      }
    `}
              </style>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 16px',
                backgroundColor: 'black',
                color: 'white',
                border: '1px solid #ccc',
                borderLeft: 'none',
                borderRadius: '0 4px 4px 0',
                fontSize: 16, // 👈 evita o zoom no mobile
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
              title="Buscar música"
            >
              {loading ? "..." : "🔍"}
            </button>
          </form>


          <button
            onClick={() => setIsModalOpen(true)}
            style={{
              marginLeft: 20,
              padding: '6px 12px',
              backgroundColor: 'black',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 'bold',
              cursor: 'pointer',
              whiteSpace: 'normal',
              textAlign: 'center',
              height: 36,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              lineHeight: 1.1,
            }}
            title="Adicionar nova música"
          >
            Adicionar<br />manual
          </button>
        </div>



        <div style={{ padding: 20, fontFamily: 'Arial, sans-serif', backgroundColor: '#fff', color: '#000' }}>
          {/* ... (seu conteúdo existente) */}
        </div>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {results.map((song) => (
            <li
              key={song.id}
              onClick={() => togglePlay(song)} // Agora a linha inteira toca a música
              style={{
                padding: '12px',
                borderBottom: '1px solid #eee',
                display: 'flex',
                alignItems: 'center',
                transition: 'all 0.2s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f5f5f5';
                e.currentTarget.style.transform = 'translateX(5px)';
                e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '';
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <img
                src={song.album.cover_small}
                alt="cover"
                style={{
                  marginRight: 10,
                  width: 50,
                  height: 50,
                  objectFit: 'cover',
                  borderRadius: 4,
                }}
              />

              <div style={{ flexGrow: 1, maxWidth: 'calc(100% - 220px)' }}>
                <strong style={{ display: 'block', fontSize: 16, lineHeight: 1.2 }}>
                  {song.title}
                </strong>
                <span style={{ fontSize: 12, color: '#555', display: 'block', marginTop: 4 }}>
                  {song.artist.name}
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation(); // Evita que o clique do botão propague para o <li>
                  togglePlay(song);
                }}
                style={{
                  marginRight: 20,
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  width: 36,
                  height: 36,
                  verticalAlign: 'middle',
                }}
                aria-label={playingId === song.id ? 'Pausar' : 'Tocar'}
              >
                {playingId === song.id ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#0B3D91" viewBox="0 0 24 24">
                    <rect x="6" y="5" width="4" height="14" />
                    <rect x="14" y="5" width="4" height="14" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#0B3D91" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation(); // Evita conflito com o clique no <li>
                  openModal(song);
                }}
                style={{
                  padding: '8px 15px',
                  backgroundColor: 'black',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  height: 36,
                }}
              >
                Salvar
              </button>
            </li>
          ))}
        </ul>

        {/* Adicione o BottomSheet no final */}
        {savedSongsBottomSheet}
        {isModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              zIndex: 1000,
            }}
            onClick={() => setIsModalOpen(false)}
          >
            <div
              style={{
                backgroundColor: '#ffffff',     // tema principal: branco
                padding: 30,
                borderRadius: 8,
                minWidth: 320,
                width: '90%',
                maxWidth: 500,
                borderBottom: '4px solid #000000', // secundário: preto
                boxSizing: 'border-box',
                color: '#000000',               // texto principal: preto
                fontFamily: 'Montserrat, sans-serif',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                style={{
                  color: '#000000',
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: '700',
                  fontSize: '1.8rem',
                  marginBottom: 20,
                  borderBottom: '2px solid #000000',
                  paddingBottom: 10,
                }}
              >
                Editar e Salvar Música
              </h3>

              <label
                style={{
                  display: 'block',
                  marginBottom: 15,
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: '600',
                  fontSize: '1rem',
                }}
              >
                Título:
                <input
                  type="text"
                  name="title"
                  value={editSong.title}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: 8,
                    marginTop: 6,
                    borderRadius: 4,
                    border: '1px solid #ccc',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '1rem',
                  }}
                />
              </label>

              <label
                style={{
                  display: 'block',
                  marginBottom: 15,
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: '600',
                  fontSize: '1rem',
                }}
              >
                Artista:
                <input
                  type="text"
                  name="artist"
                  value={editSong.artist}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: 8,
                    marginTop: 6,
                    borderRadius: 4,
                    border: '1px solid #ccc',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '1rem',
                  }}
                />
              </label>

              <label
                style={{
                  display: 'block',
                  marginBottom: 15,
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: '600',
                  fontSize: '1rem',
                }}
              >
                Álbum:
                <input
                  type="text"
                  name="album"
                  value={editSong.album}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: 8,
                    marginTop: 6,
                    borderRadius: 4,
                    border: '1px solid #ccc',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '1rem',
                  }}
                />
              </label>

              <div style={{ marginBottom: 15 }}>
                <span
                  style={{
                    display: 'block',
                    marginBottom: 6,
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: '600',
                    fontSize: '1rem',
                  }}
                >
                  Link do Deezer:
                </span>
                <label style={{ display: 'block', position: 'relative', width: '100%' }}>
                  <input
                    type="text"
                    name="deezer_link"
                    value={editSong.deezer_link}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '8px 32px 8px 8px',
                      borderRadius: 4,
                      border: '1px solid #ccc',
                      backgroundColor: '#ffffff',
                      color: '#000000',
                      boxSizing: 'border-box',
                      fontFamily: 'Montserrat, sans-serif',
                      fontSize: '1rem',
                    }}
                  />
                  <FaTrash
                    onClick={() => setEditSong(prev => ({ ...prev, deezer_link: '' }))}
                    style={{
                      position: 'absolute',
                      right: 8,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      cursor: 'pointer',
                      color: 'red',
                      fontSize: 14,
                    }}
                    title="Limpar campo"
                  />
                </label>
              </div>

              <label
                style={{
                  display: 'block',
                  marginBottom: 15,
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: '600',
                  fontSize: '1rem',
                }}
              >
                Link do YouTube:
                <input
                  type="text"
                  name="youtube_link"
                  value={editSong.youtube_link}
                  onChange={handleChange}
                  placeholder="Cole o link do vídeo do YouTube"
                  style={{
                    width: '100%',
                    padding: 8,
                    marginTop: 6,
                    borderRadius: 4,
                    border: '1px solid #ccc',
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    fontFamily: 'Montserrat, sans-serif',
                    fontSize: '1rem',
                  }}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: '8px 15px',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 4,
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: '600',
                    fontSize: '1rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
                <button
                  onClick={saveToFirestore}
                  style={{
                    padding: '8px 15px',
                    backgroundColor: '#000000',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: 4,
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: '600',
                    fontSize: '1rem',
                    cursor: 'pointer',
                  }}
                >
                  Salvar Música
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </>
  );
}