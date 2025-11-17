-- Script de test pour insérer des données de résultats
-- À exécuter après avoir un trial existant dans la base

-- Exemple d'insertion de résultats pour le trial avec node_id = 1
-- (Remplacer par un node_id existant dans votre base)

-- Étape de résultat 1
INSERT INTO `results_steps` (trial_node_id, step_number, description) VALUES
(1, 1, 'Contrôle après trempe');

-- Récupérer le result_step_id qui vient d'être créé
SET @result_step_id = LAST_INSERT_ID();

-- Échantillon 1
INSERT INTO `results_samples` (result_step_id, sample_number, description, ecd_hardness_unit, ecd_hardness_value) VALUES
(@result_step_id, 1, 'Échantillon flanc', 'HV', '650');

SET @sample_id_1 = LAST_INSERT_ID();

-- Points de dureté pour échantillon 1
INSERT INTO `results_hardness_points` (sample_id, unit, value, location) VALUES
(@sample_id_1, 'HV', '680', 'surface'),
(@sample_id_1, 'HV', '650', 'tooth'),
(@sample_id_1, 'HV', '620', 'core');

-- Positions ECD pour échantillon 1
INSERT INTO `results_ecd_positions` (sample_id, distance, location) VALUES
(@sample_id_1, 0.5, 'surface'),
(@sample_id_1, 1.0, 'tooth'),
(@sample_id_1, 2.0, 'core');

-- Série de courbes pour échantillon 1
INSERT INTO `results_curve_series` (sample_id, name) VALUES
(@sample_id_1, 'Courbe de filiation flanc');

SET @series_id_1 = LAST_INSERT_ID();

-- Points de courbe
INSERT INTO `results_curve_points` (series_id, distance, value) VALUES
(@series_id_1, 0.0, 680),
(@series_id_1, 0.5, 670),
(@series_id_1, 1.0, 650),
(@series_id_1, 1.5, 635),
(@series_id_1, 2.0, 620),
(@series_id_1, 2.5, 600);

-- Échantillon 2
INSERT INTO `results_samples` (result_step_id, sample_number, description, ecd_hardness_unit, ecd_hardness_value) VALUES
(@result_step_id, 2, 'Échantillon pied', 'HV', '630');

SET @sample_id_2 = LAST_INSERT_ID();

-- Points de dureté pour échantillon 2
INSERT INTO `results_hardness_points` (sample_id, unit, value, location) VALUES
(@sample_id_2, 'HV', '660', 'surface'),
(@sample_id_2, 'HV', '630', 'tooth'),
(@sample_id_2, 'HV', '610', 'core');

-- Positions ECD pour échantillon 2
INSERT INTO `results_ecd_positions` (sample_id, distance, location) VALUES
(@sample_id_2, 0.5, 'surface'),
(@sample_id_2, 1.2, 'tooth'),
(@sample_id_2, 2.5, 'core');

-- Série de courbes pour échantillon 2
INSERT INTO `results_curve_series` (sample_id, name) VALUES
(@sample_id_2, 'Courbe de filiation pied');

SET @series_id_2 = LAST_INSERT_ID();

-- Points de courbe
INSERT INTO `results_curve_points` (series_id, distance, value) VALUES
(@series_id_2, 0.0, 660),
(@series_id_2, 0.5, 650),
(@series_id_2, 1.0, 630),
(@series_id_2, 1.5, 620),
(@series_id_2, 2.0, 610),
(@series_id_2, 2.5, 590);

-- Étape de résultat 2
INSERT INTO `results_steps` (trial_node_id, step_number, description) VALUES
(1, 2, 'Contrôle après revenu');

SET @result_step_id_2 = LAST_INSERT_ID();

-- Échantillon 1 pour étape 2
INSERT INTO `results_samples` (result_step_id, sample_number, description, ecd_hardness_unit, ecd_hardness_value) VALUES
(@result_step_id_2, 1, 'Échantillon après revenu', 'HV', '580');

SET @sample_id_3 = LAST_INSERT_ID();

-- Points de dureté
INSERT INTO `results_hardness_points` (sample_id, unit, value, location) VALUES
(@sample_id_3, 'HV', '600', 'surface'),
(@sample_id_3, 'HV', '580', 'tooth'),
(@sample_id_3, 'HV', '560', 'core');

-- Positions ECD
INSERT INTO `results_ecd_positions` (sample_id, distance, location) VALUES
(@sample_id_3, 0.5, 'surface'),
(@sample_id_3, 1.0, 'tooth'),
(@sample_id_3, 2.0, 'core');

-- Courbe de filiation
INSERT INTO `results_curve_series` (sample_id, name) VALUES
(@sample_id_3, 'Courbe après revenu');

SET @series_id_3 = LAST_INSERT_ID();

INSERT INTO `results_curve_points` (series_id, distance, value) VALUES
(@series_id_3, 0.0, 600),
(@series_id_3, 0.5, 595),
(@series_id_3, 1.0, 580),
(@series_id_3, 1.5, 570),
(@series_id_3, 2.0, 560),
(@series_id_3, 2.5, 545);
