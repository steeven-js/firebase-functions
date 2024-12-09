import { logger } from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();

export const triggerEvent = onRequest(async (req, res) => {
    try {
        const { firebaseId, updates } = req.body;

        if (!firebaseId || !updates) {
            res.status(400).json({ error: 'firebaseId and updates are required' });
            return;
        }

        // Valider les champs de mise à jour attendus
        const expectedFields = ['status', 'isActive', 'lastUpdated'];
        const missingFields = expectedFields.filter(field => updates[field] === undefined);

        if (missingFields.length > 0) {
            res.status(400).json({ 
                error: `Missing required fields in updates: ${missingFields.join(', ')}` 
            });
            return;
        }

        // Mettre à jour le document dans Firestore avec les valeurs reçues
        const eventRef = getFirestore()
            .collection('events')
            .doc(firebaseId);

        // Convertir la date en objet Date Firebase
        const firestoreUpdates = {
            status: updates.status,
            isActive: updates.isActive,
            lastUpdated: new Date(updates.lastUpdated)
        };

        await eventRef.update(firestoreUpdates);

        logger.log(`Event ${firebaseId} has been updated with:`, firestoreUpdates);
        res.json({ 
            success: true, 
            message: `Event ${firebaseId} has been updated`,
            updates: firestoreUpdates
        });
    } catch (error) {
        logger.error('Error processing event:', error);
        res.status(500).json({ error: error.message });
    }
});