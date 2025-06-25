import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faCalendarAlt, faFlask, faCogs, faBox } from '@fortawesome/free-solid-svg-icons';

// Configuration des couleurs et styles par section
const getSectionConfig = (sectionType) => {
  const configs = {
    identification: {
      gradientColors: 'linear-gradient(135deg, #d32f2f 0%, #f57c00 50%, #ff9800 100%)',
      shadowColor: 'rgba(211, 47, 47, 0.3)'
    },
    load: {
      gradientColors: 'linear-gradient(135deg, #d32f2f 0%, #f57c00 50%, #ff9800 100%)',
      shadowColor: 'rgba(255, 193, 7, 0.3)'
    },
    recipe: {
      gradientColors: 'linear-gradient(135deg, #d32f2f 0%, #f57c00 50%, #ff9800 100%)',
      shadowColor: 'rgba(211, 47, 47, 0.3)'
    },
    curves: {
      gradientColors: 'linear-gradient(135deg, #d32f2f 0%, #f57c00 50%, #ff9800 100%)',
      shadowColor: 'rgba(25, 118, 210, 0.3)'
    },
    micrography: {
      gradientColors: 'linear-gradient(135deg, #d32f2f 0%, #f57c00 50%, #ff9800 100%)',
      shadowColor: 'rgba(56, 142, 60, 0.3)'
    },
    control: {
      gradientColors: 'linear-gradient(135deg, #d32f2f 0%, #f57c00 50%, #ff9800 100%)',
      shadowColor: 'rgba(123, 31, 162, 0.3)'
    }
  };
  
  return configs[sectionType] || configs.identification;
};

const SectionHeader = ({ 
  title, 
  subtitle, 
  icon, 
  testData, 
  clientData, 
  sectionType = 'identification', // Nouveau prop pour déterminer le type de section
  gradientColors, // Peut être override
  shadowColor, // Peut être override
  showSubtitle = true,
  isFirstPage = false 
}) => {
  // Utiliser la configuration de section ou les props override
  const config = getSectionConfig(sectionType);
  const finalGradientColors = gradientColors || config.gradientColors;
  const finalShadowColor = shadowColor || config.shadowColor;

  return (
    <div style={{
      background: finalGradientColors,
      borderRadius: '12px',
      padding: '20px',
      marginBottom: '30px',
      boxShadow: `0 8px 32px ${finalShadowColor}`,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Motif décoratif */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '200px',
        height: '100%',
        background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
        borderRadius: '50%',
        transform: 'translateX(50px)'
      }}></div>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <div>
          <h1 style={{ 
            color: 'white', 
            fontSize: '28px', 
            fontWeight: 'bold', 
            margin: '0 0 5px 0',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <FontAwesomeIcon icon={icon} />
            {title}
          </h1>
          {showSubtitle && subtitle && (
            <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: '16px', fontWeight: '500' }}>
              <FontAwesomeIcon icon={faBox} style={{ marginRight: '8px' }} />
              {subtitle}
            </div>
          )}
        </div>
        
        <div style={{ 
          background: 'rgba(255,255,255,0.15)', 
          borderRadius: '8px', 
          padding: '15px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <img 
            src="/images/logoECM.png" 
            alt="Logo ECM" 
            style={{ height: '50px', width: 'auto', filter: 'brightness(0) invert(1)' }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'block';
            }}
          />
          <div style={{ 
            display: 'none', 
            color: 'white', 
            fontWeight: 'bold', 
            fontSize: '20px',
            textAlign: 'center',
            padding: '15px'
          }}>
            ECM
          </div>
        </div>
      </div>
      
      {/* Informations communes du test */}
      <div style={{ 
        marginTop: '20px', 
        display: 'flex', 
        gap: '25px', 
        flexWrap: 'wrap',
        position: 'relative',
        zIndex: 1,
        fontSize: '14px'
      }}>
        <div style={{ color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FontAwesomeIcon icon={faUser} />
          <span style={{ fontWeight: '600' }}>Client:</span>
          <span>{clientData?.name || testData?.client_name || 'Not specified'}</span>
          {(clientData?.country || testData?.client_country) && (
            <>
              <span style={{ margin: '0 4px', opacity: 0.7 }}>•</span>
              <span>{clientData?.country || testData?.client_country}</span>
            </>
          )}
        </div>
        <div style={{ color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FontAwesomeIcon icon={faCogs} />
          <span style={{ fontWeight: '600' }}>Treatment:</span>
          <span>{testData?.processType || testData?.process_type || 'Not specified'}</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FontAwesomeIcon icon={faFlask} />
          <span style={{ fontWeight: '600' }}>Load N°:</span>
          <span>{testData?.loadNumber || testData?.load_number || testData?.testCode || testData?.test_code || 'Not specified'}</span>
          <span style={{ margin: '0 4px', opacity: 0.7 }}>•</span>
          <FontAwesomeIcon icon={faCalendarAlt} />
          <span>
            {testData?.testDate || testData?.test_date 
              ? new Date(testData.testDate || testData.test_date).toLocaleDateString('en-US') 
              : 'Not specified'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SectionHeader;
