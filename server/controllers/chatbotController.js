const { exec } = require('child_process');
const path = require('path');
const logger = require('../utils/logger');

/**
 * Contrôleur pour gérer les interactions avec le chatbot
 */
const chatbotController = {
  /**
   * Traite un message utilisateur et renvoie une réponse
   * @param {Object} req - La requête Express
   * @param {Object} res - La réponse Express
   */
  processMessage: async (req, res) => {
    try {
      const { message, threshold } = req.body;
      
      if (!message || message.trim() === '') {
        return res.status(400).json({
          error: 'Le message ne peut pas être vide'
        });
      }

      // Vérification pour la question spécifique (exemple de hardcoding comme dans votre ancien code)
      if (message === 'Existe il des essais qui utilisent MNCH5 ?') {
        return res.json({
          response: `Oui, il y a 8 resultats :<br>
            <strong>1 résultat avec une pertinence de 100% :</strong><br>
            <a href="/api/files/download?file=doc1.xlsx">doc1.xlsx</a><br>
            <strong>3 résultats avec une pertinence minimum de 90% :</strong><br>
            <a href="/api/files/download?file=doc2.xlsx">doc2.xlsx</a><br>
            <a href="/api/files/download?file=doc3.xlsx">doc3.xlsx</a><br>
            <a href="/api/files/download?file=doc4.xlsx">doc4.xlsx</a><br>
            <strong>4 résultats avec une pertinence minimum de 80% :</strong><br>
            <a href="/api/files/download?file=doc5.xlsx">doc5.xlsx</a><br>
            <a href="/api/files/download?file=doc6.xlsx">doc6.xlsx</a><br>
            <a href="/api/files/download?file=doc7.xlsx">doc7.xlsx</a><br>
            <a href="/api/files/download?file=doc8.xlsx">doc8.xlsx</a><br><br>
            Pertinence minimum configurée à ${threshold}%, voulez vous afficher plus de resultats quand même ?`
        });
      }
      
      // Chemin vers votre script Python (à adapter selon votre nouvelle structure)
      const pythonScriptPath = path.join(__dirname, '../scripts/nltk_analysis.py');
      
      // Exécution du script Python
      exec(`python "${pythonScriptPath}" "${message}"`, (error, stdout, stderr) => {
        if (error) {
          logger.error(`Erreur d'exécution du script Python: ${error.message}`);
          return res.status(500).json({
            error: "Erreur lors de l'analyse NLTK."
          });
        }
        
        if (stderr) {
          logger.error(`Stderr du script Python: ${stderr}`);
        }
        
        if (stdout) {
          // Traitement de la sortie du script Python
          const lines = stdout.split('\n');
          const tokens = lines.length > 1 ? lines[1].split(':')[1].trim() : '';
          const tagged = lines.length > 2 ? lines[2].split(':')[1].trim() : '';
          
          return res.json({
            response: `Message: ${message}<br>Tokens: ${tokens}<br>Tags: ${tagged}`
          });
        } else {
          return res.status(500).json({
            error: "Pas de résultat de l'analyse NLTK."
          });
        }
      });
    } catch (error) {
      logger.error(`Erreur dans le contrôleur du chatbot: ${error.message}`);
      res.status(500).json({
        error: "Une erreur s'est produite lors du traitement de votre message."
      });
    }
  }
};

module.exports = chatbotController;