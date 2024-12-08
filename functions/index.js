// Le SDK Cloud Functions pour Firebase pour créer des fonctions Cloud et des déclencheurs.
import { logger } from "firebase-functions";
import { onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

// Le SDK Firebase Admin pour accéder à Firestore.
import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

initializeApp();

// Récupère le paramètre "text" passé à ce point de terminaison HTTP 
// et l'insère dans Firestore sous le chemin /messages/:documentId/original
export const addmessage = onRequest(async (req, res) => {
    // Récupère le paramètre "text".
    const original = req.query.text;
    // Ajoute le nouveau message dans Firestore en utilisant le SDK Firebase Admin.
    const writeResult = await getFirestore()
    .collection("messages")
    .add({ original: original });
    // Renvoie un message confirmant que le message a été ajouté avec succès.
    res.json({ result: `Message with ID: ${writeResult.id} added.` });
});

// Écoute les nouveaux messages ajoutés à /messages/:documentId/original
// et enregistre une version en majuscules du message 
// dans /messages/:documentId/uppercase
export const makeuppercase = onDocumentCreated("/messages/{documentId}", (event) => {
    // Récupère la valeur actuelle écrite dans Firestore.
    const original = event.data.data().original;

    // Accède au paramètre {documentId} avec event.params
    logger.log("Conversion en majuscules", event.params.documentId, original);

    const uppercase = original.toUpperCase();

    // Vous devez retourner une Promesse lorsque vous effectuez
    // des tâches asynchrones dans une fonction,
    // comme écrire dans Firestore.
    // La définition d'un champ 'uppercase' dans le document Firestore retourne une Promesse.
    return event.data.ref.set({ uppercase }, { merge: true });
});

/**
 *  Madinia - Cloud functions
 */

// Récupère les events programmés 
export const getScheduledEvents = onRequest(async (req, res) => {
    try {
        // Récupération des événements programmés
        const eventsRef = getFirestore().collection("events");
        const snapshot = await eventsRef.where("isScheduledDate", "==", true).get();

        // Transformation des documents en incluant leur ID
        const events = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data()
        }));

        // Retour de la réponse
        res.status(200).json({ 
            success: true,
            events 
        });

    } catch (error) {
        // En cas d'erreur
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// Passe l'event programmé ed false à true quand heure de l'event est atteinte
// export const scheduleEvent = onRequest(async (req, res) => {
//     const eventId = req.query.eventId;
//     const eventRef = getFirestore().collection("events").doc(eventId);
//     const event = await eventRef.get();
//     if (!event.exists) {
//         res.status(404).json({ error: "Event not found" });
//         return;
//     }
//     if (event.data().scheduledAt.toDate() > new Date()) {
//         res.status(400).json({ error: "Event not scheduled yet" });
//         return;
//     }
//     await eventRef.update({ scheduled: true });
//     res.json({ result: `Event ${eventId} scheduled` });
// });