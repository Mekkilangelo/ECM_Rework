import React from 'react';
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { getBaseUrl } from '../../../../../config/apiConfig';

const styles = StyleSheet.create({
    footerContainer: {
        position: 'absolute',
        bottom: 10,
        left: 20,
        right: 20,
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0', // Light gray border
        paddingTop: 8,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    leftSection: {
        width: '30%',
    },
    centerSection: {
        width: '40%',
        alignItems: 'center',
    },
    rightSection: {
        width: '30%',
        alignItems: 'flex-end',
    },
    generatedDate: {
        fontSize: 8,
        color: '#94a3b8', // Muted text
        fontFamily: 'Helvetica',
    },
    footerLogo: {
        height: 25,
        objectFit: 'contain',
    },
    pageNumber: {
        fontSize: 9,
        color: '#64748b',
        fontFamily: 'Helvetica',
    },
});

/**
 * Common Footer for all PDF pages
 * @param {string} generatedDate - Date formatted string
 * @param {string} logoSynergyUrl - URL for Synergy Center logo
 */
export const CommonReportFooter = ({
    generatedDate,
    logoSynergyUrl = '/images/synergy_logo.png'
}) => {
    // Fix URL if needed - Utiliser la configuration centralisée
    const baseURL = getBaseUrl();
    const fullLogoUrl = logoSynergyUrl.startsWith('http') ? logoSynergyUrl : `${baseURL}${logoSynergyUrl}`;

    return (
        <View style={styles.footerContainer} fixed>
            {/* Left: Generated Date */}
            <View style={styles.leftSection}>
                <Text style={styles.generatedDate}>Généré le {generatedDate}</Text>
            </View>

            {/* Center: Synergy Logo */}
            <View style={styles.centerSection}>
                {/* Using local component for logo if available, or just text/image */}
                <Image
                    src={fullLogoUrl}
                    style={styles.footerLogo}
                />
            </View>

            {/* Right: Pagination */}
            <View style={styles.rightSection}>
                <Text
                    style={styles.pageNumber}
                    render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
                />
            </View>
        </View>
    );
};

export default CommonReportFooter;
