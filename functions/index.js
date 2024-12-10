import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

initializeApp();

/**
 * Cloud Function qui s'exécute toutes les 30 minutes pour vérifier et activer 
 * les événements programmés dont la date est arrivée.
 * Coût estimé : ~1 440 exécutions par mois
 */
export const checkScheduledEvents = onSchedule("every 30 minutes", async (event) => {
    const db = getFirestore();
    const now = Timestamp.now();

    try {
        logger.info('Starting scheduled event check:', now.toDate());

        const eventsRef = db.collection('events');
        const snapshot = await eventsRef
            .where('isScheduledDate', '==', true)
            .where('status', '==', 'pending')
            .get();

        const batch = db.batch();
        let updateCount = 0;

        for (const doc of snapshot.docs) {
            const event = doc.data();
            const scheduledDate = new Date(event.scheduledDate);

            // Vérifier si la date programmée est passée
            if (scheduledDate <= now.toDate()) {
                const eventRef = eventsRef.doc(doc.id);
                batch.update(eventRef, {
                    status: 'current',
                    _activatedAt: now,
                    _lastChecked: now,
                    isActive: true
                });

                logger.info(`Scheduling activation for event: ${doc.id}, scheduled for: ${event.scheduledDate}`);
                updateCount++;
            }
        }

        // Exécuter les mises à jour en batch si nécessaire
        if (updateCount > 0) {
            await batch.commit();
            logger.info(`Successfully updated ${updateCount} events to current status`);
        } else {
            logger.info('No events needed updating at this time');
        }

        return null;
    } catch (error) {
        logger.error('Error checking scheduled events:', error);
        throw new Error(`Failed to process scheduled events: ${error.message}`);
    }
});