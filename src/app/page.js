"use client";

import { useState, useEffect, useRef } from "react";
import { FaTrash, FaMusic } from "react-icons/fa";
import { useRouter } from "next/navigation"; import Loading from "@/components/loading";

import { db } from "@/firebase/firebase"; // Ajuste o caminho conforme sua estrutura
import { collection, addDoc, getDocs, deleteDoc, doc, query, where } from "firebase/firestore";
import Badge from "./Badge";
export default function DeezerSearchPage() {
  const [loadingSavedSongs, setLoadingSavedSongs] = useState(true); // Adicione este estado


  const router = useRouter();
  const audioRef = useRef(new Audio());
  const [user, setUser] = useState(null);
  // Todos os hooks devem vir antes de qualquer lógica condicional
  const [authenticated, setAuthenticated] = useState(false);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false); const [savedSongs, setSavedSongs] = useState([]); // Estado para músicas salvas
  const [showSavedSongs, setShowSavedSongs] = useState(false

  ); // Estado para controlar o Botto
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
  const [editSong, setEditSong] = useState({
    title: '',
    artist: '',
    album: '',
    preview: '',
    cover: '',
    deezer_link: '',
    youtube_link: '',
  });

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
  };

  useEffect(() => {
    if (user?.user_id) {
      loadSavedSongs();
    }
  }, [user?.user_id]); // Recarrega quando o user_id mudar
  // Verificar autenticação ao carregar a página
  useEffect(() => {
    audioRef.current.pause();

    const checkAuth = () => {
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
      loadSavedSongs(); // Já está aqui, mas agora com o loading

      const avatar = document.querySelector('[data-avatar]');
      if (avatar && userData.name) {
        avatar.textContent = userData.name.charAt(0).toUpperCase();
      }
    }
  }, [router]);
  const loadSavedSongs = async () => {
    try {
      setLoadingSavedSongs(true);
      const q = query(
        collection(db, 'playlista'),
        where('user_id', '==', user?.user_id) // Filtra apenas as músicas do usuário logado
      );
      const querySnapshot = await getDocs(q);
      const songs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setSavedSongs(songs);
    } catch (error) {
      console.error("Erro ao carregar músicas:", error);
      alert("Erro ao carregar músicas salvas");
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
    if (playingId === song.id) {
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      audioRef.current.src = song.preview;
      audioRef.current.play();
      setPlayingId(song.id);

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
    <div style={styles.appBar}>
      <button
        onClick={() => router.back()}
        style={{
          background: 'none',
          color: 'white',
          border: 'none',
          fontSize: '20px',
          cursor: 'pointer',
          marginRight: '10px'
        }}
        title="Voltar"
      >
        ←
      </button>

      <div style={styles.avatar}>
        U
      </div>

      <div style={styles.userName}>{user?.name || 'Usuário'}</div>

      {/* Novo botão para mostrar músicas salvas */}
      <div style={{ position: 'relative', display: 'inline-block', marginRight: '10px' }}>
        <button
          onClick={() => setShowSavedSongs(true)} // Remova loadSavedSongs() daqui
          style={{
            backgroundColor: 'transparent',
            border: 'none',
            color: 'white',
            padding: '6px',
            cursor: 'pointer',
            fontSize: '20px',
          }}
          title="Músicas salvas"
        >
          <FaMusic />
        </button>

        {!loadingSavedSongs && savedSongs.length > 0 && (
          <Badge count={savedSongs.length} />
        )}
      </div>


      <button
        onClick={() => {
          localStorage.removeItem('authToken');
          router.push('/login');
        }}
        style={{
          backgroundColor: 'transparent',
          border: '1.5px solid white',
          borderRadius: '8px',
          color: 'white',
          padding: '6px 12px',
          cursor: 'pointer',
          fontWeight: '600',
          transition: 'background-color 0.3s ease',
        }}
        title="Logout"
      >
        🔒
      </button>
    </div>
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
            <input
              type="text"
              placeholder="Digite o nome da música ou artista"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                padding: 10,
                width: '100%',
                border: '1px solid #ccc',
                borderRight: 'none',
                borderRadius: '4px 0 0 4px',
                outline: 'none',
              }}
            />
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
                fontSize: 12,
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
                backgroundColor: '#fff',
                padding: 30,
                borderRadius: 8,
                minWidth: 320,
                width: '90%',
                maxWidth: 500,
                borderBottom: '4px solid #0B3D91',
                boxSizing: 'border-box',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ color: '#0B3D91' }}>Editar e Salvar Música</h3>


              <label>
                Título:
                <input
                  type="text"
                  name="title"
                  value={editSong.title}
                  onChange={handleChange}
                  style={{ width: '100%', padding: 8, margin: '5px 0 15px', borderRadius: 4, border: '1px solid #ccc' }}
                />
              </label>

              <label>
                Artista:
                <input
                  type="text"
                  name="artist"
                  value={editSong.artist}
                  onChange={handleChange}
                  style={{ width: '100%', padding: 8, margin: '5px 0 15px', borderRadius: 4, border: '1px solid #ccc' }}
                />
              </label>

              <label>
                Álbum:
                <input
                  type="text"
                  name="album"
                  value={editSong.album}
                  onChange={handleChange}
                  style={{ width: '100%', padding: 8, margin: '5px 0 15px', borderRadius: 4, border: '1px solid #ccc' }}
                />
              </label>

              <div style={{ marginBottom: 15 }}>
                <span style={{ display: 'block', marginBottom: 5 }}>Link do Deezer:</span>
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
                      boxSizing: 'border-box',
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
                      fontSize: 12,
                    }}
                    title="Limpar campo"
                  />
                </label>
              </div>

              <label>
                Link do YouTube:
                <input
                  type="text"
                  name="youtube_link"
                  value={editSong.youtube_link}
                  onChange={handleChange}
                  placeholder="Cole o link do vídeo do YouTube"
                  style={{ width: '100%', padding: 8, margin: '5px 0 15px', borderRadius: 4, border: '1px solid #ccc' }}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  onClick={() => setIsModalOpen(false)}
                  style={{ padding: '8px 15px', backgroundColor: '#999', color: '#fff', border: 'none', borderRadius: 4 }}
                >
                  Cancelar
                </button>
                <button
                  onClick={saveToFirestore}
                  style={{ padding: '8px 15px', backgroundColor: '#0B3D91', color: '#fff', border: 'none', borderRadius: 4 }}
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