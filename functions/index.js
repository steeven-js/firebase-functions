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
