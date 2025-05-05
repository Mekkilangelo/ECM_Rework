const { exec } = require('child_process');
const path = require('path');
const logger = require('../utils/logger');
const fs = require('fs');
const iconv = require('iconv-lite');

const chatbotController = {
  processMessage: async (req, res) => {
    try {
      const { message, threshold = 50 } = req.body;
      
      logger.info(`Message reçu: ${message}`, { threshold });

      if (!message || message.trim() === '') {
        logger.warn('Tentative d\'envoi de message vide');
        return res.status(400).json({
          error: 'Le message ne peut pas être vide'
        });
      }

      const pythonPath = process.env.PYTHON_PATH || "python";
      const scriptPath = path.join(__dirname, '../scripts/search_newII.py');
      const outFilePath = path.join(__dirname, '../scripts/out.txt');
      
      const escapedMessage = message.replace(/"/g, '\\"');
      
      const command = `"${pythonPath}" "${scriptPath}" search "${outFilePath}" -q "${escapedMessage}" -STOPW -r ${threshold}`;
      
      logger.info(`Exécution de la commande: ${command}`);

      exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
          logger.error('Erreur lors de l\'exécution du script', { 
            error: error.message, 
            stderr 
          });
          return res.status(500).json({ error: 'Erreur lors de l\'exécution de la recherche' });
        }

        if (stderr) {
          logger.warn('Messages d\'erreur du script', { stderr });
        }

        try {
          // NOUVELLE APPROCHE: Lire directement le fichier de sortie plutôt que 
          // de se fier à stdout qui peut avoir des problèmes d'encodage
          fs.readFile(outFilePath, (readError, data) => {
            if (readError) {
              logger.error('Erreur lors de la lecture du fichier de sortie', { 
                error: readError.message 
              });
              
              // Si la lecture du fichier échoue, on revient à l'utilisation de stdout
              processOutput(stdout);
            } else {
              // Utiliser les données du fichier de sortie
              const fileContent = data.toString('utf8');
              logger.debug('Contenu du fichier de sortie lu avec succès', { 
                fileSize: data.length 
              });
              
              processOutput(fileContent);
            }
          });
          
          function processOutput(outputContent) {
            logger.debug('Traitement de la sortie', { 
              outputLength: outputContent.length,
              sample: outputContent.substring(0, 200)  
            });
            
            if (outputContent.includes("Aucun résultat") || outputContent.trim() === '') {
              logger.info('Aucun résultat trouvé');
              return res.json({
                response: "<p>Aucun résultat trouvé pour votre recherche.</p>"
              });
            }

            // Extraction améliorée des informations
            const formattedResponse = formatResults(outputContent);
            
            logger.info('Réponse formatée générée avec succès');
            return res.json({ response: formattedResponse });
          }
        } catch (formatError) {
          logger.error('Erreur lors du formatage des résultats', { 
            error: formatError.message,
            stack: formatError.stack
          });
          return res.status(500).json({ 
            error: 'Erreur lors du formatage des résultats',
            details: formatError.message 
          });
        }
      });
    } catch (error) {
      logger.error('Erreur du contrôleur', { 
        error: error.message, 
        stack: error.stack 
      });
      res.status(500).json({
        error: "Une erreur s'est produite lors du traitement de votre message."
      });
    }
  }
};

/**
 * Format les résultats de recherche en HTML
 * @param {string} rawOutput - La sortie brute
 * @returns {string} HTML formaté
 */
function formatResults(rawOutput) {
  try {
    // Version de débogage - afficher la sortie brute avec les premiers caractères
    logger.debug('Début du formatage avec sortie brute', { 
      firstChars: rawOutput.substring(0, 100),
      length: rawOutput.length 
    });

    // Extraction du nombre total de résultats
    // Gestion des différentes formes possibles à cause des problèmes d'encodage
    let numResults = "?";
    const numResultsRegex = /(\d+)\s+r[^ ]*sultat/i;
    const numResultsMatch = rawOutput.match(numResultsRegex);
    
    if (numResultsMatch && numResultsMatch[1]) {
      numResults = numResultsMatch[1];
      logger.debug(`Nombre de résultats trouvés: ${numResults}`);
    } else {
      logger.debug('Impossible d\'extraire le nombre de résultats', {
        pattern: numResultsRegex.toString(),
        firstChars: rawOutput.substring(0, 200)
      });
    }

    // Recherche des blocs de réponse avec une regex moins sensible à l'encodage
    // Utilise juste "ponse" au lieu de "réponse" pour être plus robuste
    const responseRegex = /R[^ ]*ponse\s+(\d+)/gi;
    const responseMatches = [...rawOutput.matchAll(responseRegex)];
    
    logger.debug(`Nombre de réponses identifiées: ${responseMatches.length}`);
    
    if (responseMatches.length === 0) {
      logger.warn('Aucune réponse trouvée dans la sortie');
      // Mode de secours - afficher la sortie brute
      return `
        <div class="search-results">
          <div class="search-header">
            <strong>${numResults} résultat(s) trouvé(s)</strong>
          </div>
          <div class="results-list">
            <pre>${escapeHtml(rawOutput)}</pre>
          </div>
        </div>
      `;
    }

    // Diviser le texte en sections de réponse
    const sections = [];
    for (let i = 0; i < responseMatches.length; i++) {
      const currentMatch = responseMatches[i];
      const currentIndex = currentMatch.index;
      const nextIndex = (i < responseMatches.length - 1) 
                        ? responseMatches[i+1].index 
                        : rawOutput.length;
      
      const responseNumber = currentMatch[1];
      // Extraire la section de texte pour cette réponse
      const sectionText = rawOutput.substring(currentIndex, nextIndex);
      
      sections.push({
        number: responseNumber,
        text: sectionText
      });
    }

    // Traiter chaque section pour extraire les informations utiles
    const processedResponses = sections.map(section => {
      // Extraire le nom du fichier
      let fileName = "Fichier inconnu";
      const fileSourceRegex = /Nom du fichier source\s*:\s*([^\r\n]+)/i;
      const fileMatch = section.text.match(fileSourceRegex);
      if (fileMatch && fileMatch[1]) {
        fileName = fileMatch[1].trim();
      }
      
      // Extraire la pertinence
      let relevance = "N/A";
      const relevanceRegex = /Pertinence\s*:\s*(\d+\.\d+)%/i;
      const relevanceMatch = section.text.match(relevanceRegex);
      if (relevanceMatch && relevanceMatch[1]) {
        relevance = relevanceMatch[1];
      }
      
      // Extraire les lignes de contenu pertinent
      let contentLines = section.text
        .split(/\r?\n/) // Diviser par sauts de ligne (Windows ou Unix)
        .slice(0, 10) // Prendre les 10 premières lignes
        .filter(line => line.trim() !== '') // Supprimer les lignes vides
        .map(line => escapeHtml(line.trim())); // Échapper les caractères HTML

      return {
        number: section.number,
        fileName,
        relevance,
        contentLines
      };
    });
    
    // Générer le HTML formaté
    let html = `
      <div class="search-results">
        <div class="search-header">
          <strong>${numResults} résultat(s) trouvé(s)</strong>
        </div>
        <div class="results-list">
    `;
    
    processedResponses.forEach(response => {
      html += `
        <div class="search-result">
          <div class="result-header">
            <span class="result-number">Réponse ${response.number}</span>
            <span class="file-name">${response.fileName}</span>
            <span class="result-relevance">Pertinence: ${response.relevance}%</span>
          </div>
          <div class="result-preview">
            ${response.contentLines.map(line => `<p>${line}</p>`).join('')}
          </div>
        </div>
      `;
    });
    
    html += `
        </div>
      </div>
    `;
    
    return html;
  } catch (error) {
    logger.error('Erreur dans formatResults', { 
      error: error.message, 
      stack: error.stack 
    });
    
    // Mode de secours en cas d'erreur - afficher un message simple
    return `
      <div class="search-results">
        <div class="search-header error">
          <strong>Erreur lors du formatage des résultats</strong>
        </div>
        <div class="results-list">
          <p>Une erreur s'est produite: ${escapeHtml(error.message)}</p>
          <p>Voici les résultats bruts:</p>
          <pre>${escapeHtml(rawOutput.substring(0, 2000))}...</pre>
        </div>
      </div>
    `;
  }
}

/**
 * Échappe les caractères HTML spéciaux
 * @param {string} unsafe - Chaîne à échapper
 * @returns {string} Chaîne échappée
 */
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

module.exports = chatbotController;
