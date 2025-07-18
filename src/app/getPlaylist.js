// lib/getPlaylists.js
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export async function getAllPlaylists() {
    const querySnapshot = await getDocs(collection(db, 'playlista'));
    const playlists = [];

    querySnapshot.forEach((doc) => {
        playlists.push({ id: doc.id, ...doc.data() });
    });

    return playlists;
}
