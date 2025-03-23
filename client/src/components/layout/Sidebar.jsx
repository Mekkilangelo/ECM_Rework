import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
    faHome, faUsers, faDatabase, faLayerGroup, 
    faEraser, faChartLine, faUniversity, faBook, 
    faTicketAlt, faAngleLeft, faAngleRight, faSearch
} from '@fortawesome/free-solid-svg-icons';
import Select from 'react-select';
import { cleanData } from '../../services/nodeService';
import { toast } from 'react-toastify';
import '../../styles/sidebar.css';

const Sidebar = () => {
    const location = useLocation();
    const [allClients, setAllClients] = useState([]);
    const [selectedClient, setSelectedClient] = useState(null);
    const [isToggled, setIsToggled] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Fonction pour gérer le nettoyage des données
    const handleDataCleaning = async (e) => {
        e.preventDefault();
        
        // Confirmation avant suppression
        const isConfirmed = window.confirm(
            'Attention ! Cette action va supprimer définitivement toutes les données de l\'application.\n\n' +
            'Êtes-vous sûr de vouloir continuer ?'
        );
        
        if (!isConfirmed) return;
        
        try {
            setIsLoading(true);
            
            // Appel de l'API pour nettoyer les données
            const result = await cleanData();
            
            // Afficher un message de succès
            toast.success(result.message || 'Données supprimées avec succès');
            
            // Attendre 2 secondes avant de recharger la page
            setTimeout(() => {
                window.location.reload();
            }, 2000);
            
        } catch (error) {
            // Afficher un message d'erreur
            toast.error(error.message || 'Erreur lors de la suppression des données');
            setIsLoading(false);
        }
    };

    // Fonction pour simuler le chargement des clients depuis l'API
    useEffect(() => {
        // À remplacer par votre appel API réel
        const fetchClients = async () => {
            try {
                // Simule un appel API avec des données fictives
                const mockClients = [
                    { id: 1, name: 'Client 1', client_code: 'C001' },
                    { id: 2, name: 'Client 2', client_code: 'C002' },
                    { id: 3, name: 'Client 3', client_code: 'C003' },
                    { id: 4, name: 'Client 4', client_code: 'C004' },
                    { id: 5, name: 'Client 5', client_code: 'C005' }
                ];
                setAllClients(mockClients);
            } catch (error) {
                console.error('Erreur lors du chargement des clients:', error);
            }
        };

        fetchClients();
    }, []);

    const handleClientChange = (selectedOption) => {
        setSelectedClient(selectedOption);
        // Logique pour filtrer les données en fonction du client sélectionné
    };

    const handleToggleSidebar = () => {
        setIsToggled(!isToggled);
        document.body.classList.toggle('sidebar-toggled');
    };

    // Créer les options pour React-Select
    const clientOptions = [
        { value: '', label: 'All clients' },
        ...allClients.map(client => ({
            value: client.id,
            label: `${client.name} (${client.client_code})`
        }))
    ];

    // Style personnalisé pour React-Select
    const customSelectStyles = {
        control: (provided, state) => ({
            ...provided,
            backgroundColor: 'white',
            borderColor: '#d1d3e2',
            boxShadow: state.isFocused ? '0 0 0 0.2rem rgba(78, 115, 223, 0.25)' : null,
            borderRadius: '0.35rem',
            minHeight: '38px',
            fontSize: '0.85rem',
            '&:hover': {
                borderColor: state.isFocused ? '#bac8f3' : '#d1d3e2'
            }
        }),
        menu: (provided) => ({
            ...provided,
            backgroundColor: 'white',
            borderRadius: '0.35rem',
            zIndex: 9999,
            boxShadow: '0 0.15rem 1.75rem 0 rgba(58, 59, 69, 0.15)'
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected 
                ? '#4e73df' 
                : state.isFocused 
                    ? '#f8f9fc' 
                    : null,
            color: state.isSelected ? 'white' : '#3a3b45',
            fontSize: '0.85rem',
            padding: '0.5rem 1rem',
            cursor: 'pointer',
            '&:active': {
                backgroundColor: state.isSelected ? '#4e73df' : '#eaecf4'
            }
        }),
        input: (provided) => ({
            ...provided,
            color: '#3a3b45',
            fontSize: '0.85rem'
        }),
        singleValue: (provided) => ({
            ...provided,
            color: '#3a3b45',
            fontSize: '0.85rem'
        }),
        placeholder: (provided) => ({
            ...provided,
            color: '#858796',
            fontSize: '0.85rem'
        }),
        indicatorSeparator: () => ({
            display: 'none'
        }),
        dropdownIndicator: (provided) => ({
            ...provided,
            color: '#858796',
            padding: '0 8px',
            '&:hover': {
                color: '#6e707e'
            }
        })
    };

    // Format personnalisé pour les composants React-Select
    const customComponents = {
        DropdownIndicator: ({ innerProps }) => {
            return (
                <div {...innerProps} style={{ padding: '0 8px' }}>
                    <FontAwesomeIcon icon={faSearch} size="sm" color="#858796" />
                </div>
            );
        }
    };

    // Déterminer si on est sur la page d'accueil
    const isHomePage = location.pathname === '/';

    return (
        <ul className={`navbar-nav bg-dark sidebar ${isToggled ? 'toggled' : ''} accordion shadow`} id="accordionSidebar">
            {/* Logo */}
            <a className="navbar-brand d-flex justify-content-center align-items-center py-4" href="/">
                <img className="img-fluid" src="/images/logoECM.png" alt="Logo ECM GROUP" width="140" height="60" />
            </a>

            <hr className="border-secondary mx-3" />

            {/* Dashboard */}
            <li className="nav-item">
                <Link 
                    className={`nav-link d-flex align-items-center px-3 ${isHomePage ? 'active' : ''}`}
                    to="/"
                >
                    <FontAwesomeIcon icon={faHome} className="fa-fw mr-2" />
                    <span>Dashboard</span>
                </Link>
            </li>
            
            {/* Client Selection avec React-Select */}
            <li className="nav-item p-3">
                <div id="client-form">
                    <label htmlFor="clients-en-cours-select" className="text-white small font-weight-bold mb-2 d-flex align-items-center">
                        <FontAwesomeIcon icon={faUsers} className="fa-fw mr-2" />
                        Client Selection
                    </label>
                    <Select
                        id="clients-en-cours-select"
                        options={clientOptions}
                        value={selectedClient}
                        onChange={handleClientChange}
                        placeholder="Select a client"
                        isClearable={false}
                        isSearchable={true}
                        styles={customSelectStyles}
                        components={customComponents}
                        classNamePrefix="react-select"
                        aria-label="Client selection"
                    />
                </div>
            </li>

            <hr className="border-secondary mx-3" />

            {/* Data Management Section */}
            <h6 className="sidebar-heading text-uppercase text-white-50 px-3 mt-1 mb-2">Data Management</h6>

            <li className="nav-item">
                <Link 
                    className={`nav-link d-flex align-items-center px-3 ${location.pathname === '/data-pump' ? 'active' : ''}`}
                    to="/data-pump"
                >
                    <FontAwesomeIcon icon={faDatabase} className="fa-fw mr-2" />
                    <span>Data Pump</span>
                </Link>
            </li>

            <li className="nav-item">
                <Link 
                    className={`nav-link d-flex align-items-center px-3 ${location.pathname === '/indexing' ? 'active' : ''}`}
                    to="/indexing"
                >
                    <FontAwesomeIcon icon={faLayerGroup} className="fa-fw mr-2" />
                    <span>Indexing</span>
                </Link>
            </li>
            
            <li className="nav-item">
                <a 
                    className="nav-link d-flex align-items-center px-3"
                    href="#"
                    onClick={handleDataCleaning}
                    style={{ cursor: isLoading ? 'wait' : 'pointer' }}
                >
                    <FontAwesomeIcon icon={faEraser} className="fa-fw mr-2" />
                    <span>{isLoading ? 'Nettoyage en cours...' : 'Data Cleaning'}</span>
                </a>
            </li>

            <li className="nav-item">
                <Link 
                    className={`nav-link d-flex align-items-center px-3 ${location.pathname === '/analysis' ? 'active' : ''}`}
                    to="/analysis"
                >
                    <FontAwesomeIcon icon={faChartLine} className="fa-fw mr-2" />
                    <span>Analysis</span>
                </Link>
            </li>

            {/* Archives Section */}
            <h6 className="sidebar-heading text-uppercase text-white-50 px-3 mt-4 mb-2">Archives & Reference</h6>

            <li className="nav-item">
                <Link 
                    className={`nav-link d-flex align-items-center px-3 ${location.pathname === '/archives' ? 'active' : ''}`}
                    to="/archives"
                >
                    <FontAwesomeIcon icon={faUniversity} className="fa-fw mr-2" />
                    <span>Archives</span>
                </Link>
            </li>

            <li className="nav-item">
                <Link 
                    className={`nav-link d-flex align-items-center px-3 ${location.pathname === '/reference' ? 'active' : ''}`}
                    to="/reference"
                >
                    <FontAwesomeIcon icon={faBook} className="fa-fw mr-2" />
                    <span>Reference</span>
                </Link>
            </li>

            {/* Support Section */}
            <h6 className="sidebar-heading text-uppercase text-white-50 px-3 mt-4 mb-2">Support</h6>

            <li className="nav-item mb-3">
                <Link 
                    className={`nav-link d-flex align-items-center px-3 ${location.pathname === '/ticket' ? 'active' : ''}`}
                    to="/ticket"
                >
                    <FontAwesomeIcon icon={faTicketAlt} className="fa-fw mr-2" />
                    <span>Create a ticket</span>
                </Link>
            </li>

            {/* Sidebar Toggler */}
            <div className="text-center d-none d-md-inline mt-3">
                <button 
                    className="btn btn-link text-white-50 rounded-circle" 
                    id="sidebarToggle"
                    onClick={handleToggleSidebar}
                >
                    <FontAwesomeIcon icon={isToggled ? faAngleRight : faAngleLeft} />
                </button>
            </div>
        </ul>
    );
};

export default Sidebar;
