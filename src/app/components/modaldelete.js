import React from 'react';
import { FiTrash2 } from 'react-icons/fi';
import styles from './modaldelete.module.css';

const ModalDelete = ({ isOpen, onClose, onConfirm, message }) => {
    if (!isOpen) return null;



    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <FiTrash2 size={24} />
                    <h3>Confirmar deleção</h3>
                </div>
                <p>{message || 'Tem certeza que deseja deletar este item?'}</p>
                <div className={styles.modalActions}>
                    <button className={styles.cancelButton} onClick={onClose}>
                        Cancelar
                    </button>
                    <button className={styles.deleteButton} onClick={onConfirm}>
                        Deletar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModalDelete;
